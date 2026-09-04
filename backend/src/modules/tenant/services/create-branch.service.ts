import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '../entities/branch.entity';
import { CreateBranchDto } from '../dto/branch.dto';

@Injectable()
export class CreateBranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CreateBranchDto): Promise<BranchEntity> {
    const existing = await this.branchRepository.findOne({
      where: { code: dto.code, storeId },
    });
    if (existing) {
      throw new ConflictException(`A branch with code "${dto.code}" already exists in this store.`);
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
    });

    return this.branchRepository.save(branch);
  }
}
