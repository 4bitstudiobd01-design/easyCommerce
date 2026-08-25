import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeavePolicyEntity } from '../entities/leave-policy.entity';

@Injectable()
export class GetLeavePolicyService {
  constructor(
    @InjectRepository(LeavePolicyEntity)
    private readonly leavePolicyRepository: Repository<LeavePolicyEntity>,
  ) {}

  /** Lazily creates a default policy on first read so every store has one without a
   *  separate onboarding step. */
  async execute(tenantId: string, storeId: string): Promise<LeavePolicyEntity> {
    const existing = await this.leavePolicyRepository.findOne({ where: { storeId } });
    if (existing) return existing;

    return this.leavePolicyRepository.save(this.leavePolicyRepository.create({ tenantId, storeId }));
  }
}
