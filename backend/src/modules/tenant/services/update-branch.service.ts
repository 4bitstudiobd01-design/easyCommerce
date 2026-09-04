import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BranchEntity } from '../entities/branch.entity';
import { UpdateBranchDto } from '../dto/branch.dto';

@Injectable()
export class UpdateBranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
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
