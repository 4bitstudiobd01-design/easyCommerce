import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { StaffMemberEntity, StaffStatusEnum } from '../../staff/entities/staff.entity';
import { GetMySubscriptionService } from './get-my-subscription.service';

@Injectable()
export class EnforcePlanLimitService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
    private readonly getMySubscriptionService: GetMySubscriptionService,
  ) {}

  async assertCanCreateStore(tenantId: string): Promise<void> {
    const { plan } = await this.getMySubscriptionService.execute(tenantId);

    if (plan.maxStores === null) return; // unlimited

    const currentStoreCount = await this.storeRepository.count({
      where: { tenantId, isActive: true },
    });

    if (currentStoreCount >= plan.maxStores) {
      throw new ForbiddenException(
        `Your ${plan.name} allows up to ${plan.maxStores} store(s). Upgrade your plan to create more stores.`,
      );
    }
  }

  async assertCanInviteStaff(tenantId: string, storeId: string): Promise<void> {
    const { plan } = await this.getMySubscriptionService.execute(tenantId);

    if (plan.maxStaffPerStore === null) return; // unlimited

    const currentStaffCount = await this.staffRepository.count({
      where: { storeId, status: Not(StaffStatusEnum.SUSPENDED) },
    });

    if (currentStaffCount >= plan.maxStaffPerStore) {
      throw new ForbiddenException(
        `Your ${plan.name} allows up to ${plan.maxStaffPerStore} staff member(s) per store. Upgrade your plan to invite more.`,
      );
    }
  }
}
