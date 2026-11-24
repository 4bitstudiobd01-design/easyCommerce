import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceDeductionPolicyEntity } from '../entities/attendance-deduction-policy.entity';
import { UpdateAttendanceDeductionPolicyDto } from '../dto/attendance-deduction-policy.dto';
import { GetAttendanceDeductionPolicyService } from './get-attendance-deduction-policy.service';

@Injectable()
export class UpdateAttendanceDeductionPolicyService {
  constructor(
    @InjectRepository(AttendanceDeductionPolicyEntity)
    private readonly policyRepository: Repository<AttendanceDeductionPolicyEntity>,
    private readonly getAttendanceDeductionPolicyService: GetAttendanceDeductionPolicyService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: UpdateAttendanceDeductionPolicyDto,
  ): Promise<AttendanceDeductionPolicyEntity> {
    const policy = await this.getAttendanceDeductionPolicyService.execute(tenantId, storeId);
    Object.assign(policy, dto);
    return this.policyRepository.save(policy);
  }
}
