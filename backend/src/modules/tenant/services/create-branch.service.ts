import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '../entities/branch.entity';
import { CreateBranchDto } from '../dto/branch.dto';
// Read-only existence/tenant check on the Inventory module's entity — approved
// exception to the no-cross-module-repo-import rule for this warehouse-branch
// link (see Phase 2 plan): no business logic crosses back into Inventory,
// only a tenant-scoped lookup, and TenantModule cannot import InventoryModule
// without creating a circular dependency (InventoryModule already imports
// TenantModule).
import { WarehouseEntity } from '../../inventory/entities/warehouse.entity';

@Injectable()
export class CreateBranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CreateBranchDto): Promise<BranchEntity> {
    const existing = await this.branchRepository.findOne({
      where: { code: dto.code, storeId },
    });
    if (existing) {
      throw new ConflictException(`A branch with code "${dto.code}" already exists in this store.`);
    }

    if (dto.warehouseId) {
      const warehouse = await this.warehouseRepository.findOne({
        where: { id: dto.warehouseId, tenantId },
      });
      if (!warehouse) {
        throw new NotFoundException(`Warehouse "${dto.warehouseId}" not found or access denied.`);
      }
    }

    const count = await this.branchRepository.count({ where: { storeId } });

    const branch = this.branchRepository.create({
      tenantId,
      storeId,
      name: dto.name,
      code: dto.code,
      isDefault: dto.isDefault || count === 0,
      address: dto.address,
      city: dto.city,
      phone: dto.phone,
      email: dto.email,
      isActive: dto.isActive ?? true,
      warehouseId: dto.warehouseId ?? null,
    });

    return this.branchRepository.save(branch);
  }
}
