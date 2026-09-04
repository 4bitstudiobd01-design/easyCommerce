import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '../entities/branch.entity';
// Read-only existence check on the Inventory module's entity — same
// approved cross-module repository-injection pattern used elsewhere in the
// Branch feature (see create-branch.service.ts for the original rationale).
import { BranchStockEntity } from '../../inventory/entities/branch-stock.entity';

@Injectable()
export class DeleteBranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @InjectRepository(BranchStockEntity)
    private readonly branchStockRepository: Repository<BranchStockEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, branchId: string): Promise<{ message: string }> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId, tenantId, storeId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch "${branchId}" not found or access denied.`);
    }

    const stockCount = await this.branchStockRepository.count({ where: { branchId, tenantId } });
    if (stockCount > 0) {
      throw new BadRequestException(
        'This branch still has stock recorded against it. Transfer or clear its stock before deleting.',
      );
    }

    if (branch.isDefault) {
      const otherCount = await this.branchRepository.count({ where: { storeId } });
      if (otherCount > 1) {
        throw new BadRequestException(
          'Cannot delete the default branch while other branches exist. Set another branch as default first.',
        );
      }
    }

    await this.branchRepository.remove(branch);
    return { message: 'Branch deleted successfully.' };
  }
}
