import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BranchEntity } from '../entities/branch.entity';
import { UpdateBranchDto } from '../dto/branch.dto';
// Read-only existence/tenant check on the Inventory module's entity — approved
// exception to the no-cross-module-repo-import rule for this warehouse-branch
// link (see Phase 2 plan): no business logic crosses back into Inventory,
// only a tenant-scoped lookup, and TenantModule cannot import InventoryModule
// without creating a circular dependency (InventoryModule already imports
// TenantModule).
import { WarehouseEntity } from '../../inventory/entities/warehouse.entity';

@Injectable()
export class UpdateBranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<BranchEntity> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId, tenantId, storeId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch "${branchId}" not found or access denied.`);
    }

    if (dto.code && dto.code !== branch.code) {
      const existing = await this.branchRepository.findOne({
        where: { code: dto.code, storeId, id: Not(branchId) },
      });
      if (existing) {
        throw new ConflictException(`A branch with code "${dto.code}" already exists in this store.`);
      }
    }

    if (dto.warehouseId !== undefined) {
      if (dto.warehouseId) {
        const warehouse = await this.warehouseRepository.findOne({
          where: { id: dto.warehouseId, tenantId },
        });
        if (!warehouse) {
          throw new NotFoundException(`Warehouse "${dto.warehouseId}" not found or access denied.`);
        }
      }
      branch.warehouseId = dto.warehouseId ?? null;
    }

    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.code !== undefined) branch.code = dto.code;
    if (dto.address !== undefined) branch.address = dto.address;
    if (dto.city !== undefined) branch.city = dto.city;
    if (dto.phone !== undefined) branch.phone = dto.phone;
    if (dto.email !== undefined) branch.email = dto.email;
    if (dto.isActive !== undefined) branch.isActive = dto.isActive;

    if (dto.isDefault === true && !branch.isDefault) {
      // Only one branch per store can be the default.
      await this.branchRepository.update({ storeId, isDefault: true }, { isDefault: false });
      branch.isDefault = true;
    } else if (dto.isDefault === false) {
      branch.isDefault = false;
    }

    return this.branchRepository.save(branch);
  }
}
