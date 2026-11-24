import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceDeductionPolicyEntity } from '../entities/attendance-deduction-policy.entity';

@Injectable()
export class GetAttendanceDeductionPolicyService {
  constructor(
    @InjectRepository(AttendanceDeductionPolicyEntity)
    private readonly policyRepository: Repository<AttendanceDeductionPolicyEntity>,
  ) {}

  /** Lazily creates a default policy on first read so every store has one without a
   *  separate onboarding step. */
  async execute(tenantId: string, storeId: string): Promise<AttendanceDeductionPolicyEntity> {
    const existing = await this.policyRepository.findOne({ where: { storeId } });
    if (existing) return existing;

    return this.policyRepository.save(this.policyRepository.create({ tenantId, storeId }));
  }
}
