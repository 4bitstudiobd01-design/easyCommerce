import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeavePolicyEntity } from '../entities/leave-policy.entity';
import { UpdateLeavePolicyDto } from '../dto/leave-policy.dto';
import { GetLeavePolicyService } from './get-leave-policy.service';

@Injectable()
export class UpdateLeavePolicyService {
  constructor(
    @InjectRepository(LeavePolicyEntity)
    private readonly leavePolicyRepository: Repository<LeavePolicyEntity>,
    private readonly getLeavePolicyService: GetLeavePolicyService,
  ) {}

  async execute(tenantId: string, storeId: string, dto: UpdateLeavePolicyDto): Promise<LeavePolicyEntity> {
    const policy = await this.getLeavePolicyService.execute(tenantId, storeId);
    Object.assign(policy, dto);
    return this.leavePolicyRepository.save(policy);
  }
}
