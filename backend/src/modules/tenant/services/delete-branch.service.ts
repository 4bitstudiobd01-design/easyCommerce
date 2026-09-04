import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '../entities/branch.entity';

@Injectable()
export class DeleteBranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, branchId: string): Promise<{ message: string }> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId, tenantId, storeId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch "${branchId}" not found or access denied.`);
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
