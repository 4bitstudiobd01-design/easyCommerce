import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '../entities/branch.entity';

@Injectable()
export class ListBranchesService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  async execute(tenantId: string, storeId: string): Promise<BranchEntity[]> {
    return this.branchRepository.find({
      where: { tenantId, storeId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }
}
