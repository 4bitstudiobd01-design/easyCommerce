import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { StaffMemberEntity, StaffStatusEnum } from '../entities/staff.entity';
import { InviteStaffDto } from '../dto/invite-staff.dto';
import { EnforcePlanLimitService } from '../../billing/services/enforce-plan-limit.service';

@Injectable()
export class InviteStaffService {
  constructor(
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
    private readonly enforcePlanLimitService: EnforcePlanLimitService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    invitedByUserId: string,
    dto: InviteStaffDto,
  ): Promise<StaffMemberEntity> {
    const existingStaff = await this.staffRepository.findOne({
      where: { storeId, email: dto.email.toLowerCase() },
    });

    if (existingStaff) {
      throw new ConflictException('A staff member with this email already exists for this store.');
    }

    await this.enforcePlanLimitService.assertCanInviteStaff(tenantId, storeId);

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const staff = this.staffRepository.create({
      tenantId,
      storeId,
      branchId: dto.branchId,
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      role: dto.role,
      permissions: dto.permissions || [],
      status: StaffStatusEnum.PENDING_INVITE,
      inviteToken,
      inviteExpiresAt,
      invitedByUserId,
    });

    return await this.staffRepository.save(staff);
  }
}
