import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PlanEntity, PlanCodeEnum } from '../entities/plan.entity';
import { SubscriptionEntity, SubscriptionStatusEnum } from '../entities/subscription.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { StaffMemberEntity, StaffStatusEnum } from '../../staff/entities/staff.entity';
import { GetMySubscriptionService } from './get-my-subscription.service';

export interface ChangePlanResult {
  /** True when the change was scheduled rather than applied immediately. */
  isScheduled: boolean;
  effectiveAt: Date | null;
  currentPlanCode: PlanCodeEnum;
  pendingPlanCode: PlanCodeEnum | null;
  message: string;
}

/**
 * Moves a tenant to a cheaper plan (or cancels a scheduled move).
 *
 * Upgrades are not handled here — those go through
 * InitiatePlanRenewalPaymentService because they require payment first.
 *
 * A downgrade never takes effect immediately: the merchant has already paid
 * for the current period, so the new plan starts at currentPeriodEnd and they
 * keep what they paid for until then.
 */
@Injectable()
export class ChangePlanService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
    private readonly getMySubscriptionService: GetMySubscriptionService,
  ) {}

  async execute(tenantId: string, targetPlanCode: PlanCodeEnum): Promise<ChangePlanResult> {
    const targetPlan = await this.planRepository.findOne({
      where: { code: targetPlanCode, isActive: true },
    });
    if (!targetPlan) {
      throw new NotFoundException('Invalid or inactive plan.');
    }

    const { subscription, plan: currentPlan } = await this.getMySubscriptionService.execute(tenantId);

    if (currentPlan.id === targetPlan.id) {
      throw new BadRequestException(`You are already on the ${currentPlan.name}.`);
    }

    // Upgrades must be paid for, so they are not routed through this service.
    if (Number(targetPlan.monthlyPriceBdt) > Number(currentPlan.monthlyPriceBdt)) {
      throw new BadRequestException(
        `Use the plan renewal payment flow to upgrade to the ${targetPlan.name}.`,
      );
    }

    await this.assertUsageFitsWithin(tenantId, targetPlan);

    const persisted = await this.subscriptionRepository.findOne({ where: { tenantId } });
    if (!persisted) {
      throw new NotFoundException('No subscription found for this account.');
    }

    // An expired or already-free subscription has nothing left to pay for, so
    // the downgrade applies right away rather than waiting for a period end.
    const periodHasValue =
      persisted.status === SubscriptionStatusEnum.ACTIVE &&
      Number(currentPlan.monthlyPriceBdt) > 0 &&
      persisted.currentPeriodEnd > new Date();

    if (!periodHasValue) {
      persisted.planId = targetPlan.id;
      persisted.status = SubscriptionStatusEnum.ACTIVE;
      persisted.pendingPlanId = null;
      persisted.pendingPlanEffectiveAt = null;
      await this.subscriptionRepository.save(persisted);

      return {
        isScheduled: false,
        effectiveAt: null,
        currentPlanCode: targetPlan.code,
        pendingPlanCode: null,
        message: `You are now on the ${targetPlan.name}.`,
      };
    }

    persisted.pendingPlanId = targetPlan.id;
    persisted.pendingPlanEffectiveAt = persisted.currentPeriodEnd;
    await this.subscriptionRepository.save(persisted);

    return {
      isScheduled: true,
      effectiveAt: persisted.currentPeriodEnd,
      currentPlanCode: currentPlan.code,
      pendingPlanCode: targetPlan.code,
      message: `Your ${currentPlan.name} stays active until ${persisted.currentPeriodEnd.toDateString()}, then you move to the ${targetPlan.name}.`,
    };
  }

  /** Clears a scheduled downgrade so the merchant stays on their current plan. */
  async cancelScheduledChange(tenantId: string): Promise<ChangePlanResult> {
    const persisted = await this.subscriptionRepository.findOne({ where: { tenantId } });
    if (!persisted) {
      throw new NotFoundException('No subscription found for this account.');
    }
    if (!persisted.pendingPlanId) {
      throw new BadRequestException('There is no scheduled plan change to cancel.');
    }

    persisted.pendingPlanId = null;
    persisted.pendingPlanEffectiveAt = null;
    await this.subscriptionRepository.save(persisted);

    const { plan } = await this.getMySubscriptionService.execute(tenantId);

    return {
      isScheduled: false,
      effectiveAt: null,
      currentPlanCode: plan.code,
      pendingPlanCode: null,
      message: `Scheduled change cancelled — you stay on the ${plan.name}.`,
    };
  }

  /**
   * Refuses the downgrade when the tenant is already using more than the target
   * plan allows. Enforcement elsewhere only runs on create, so letting this
   * through would leave a merchant permanently over-limit with no signal.
   */
  private async assertUsageFitsWithin(tenantId: string, targetPlan: PlanEntity): Promise<void> {
    if (targetPlan.maxStores !== null) {
      const storeCount = await this.storeRepository.count({
        where: { tenantId, isActive: true },
      });

      if (storeCount > targetPlan.maxStores) {
        const excess = storeCount - targetPlan.maxStores;
        throw new ForbiddenException(
          `You have ${storeCount} active stores but the ${targetPlan.name} allows ${targetPlan.maxStores}. Deactivate ${excess} store(s) before switching.`,
        );
      }
    }

    if (targetPlan.maxStaffPerStore !== null) {
      const stores = await this.storeRepository.find({
        where: { tenantId, isActive: true },
        select: ['id', 'name'],
      });

      for (const store of stores) {
        const staffCount = await this.staffRepository.count({
          where: { storeId: store.id, status: Not(StaffStatusEnum.SUSPENDED) },
        });

        if (staffCount > targetPlan.maxStaffPerStore) {
          const excess = staffCount - targetPlan.maxStaffPerStore;
          throw new ForbiddenException(
            `"${store.name}" has ${staffCount} staff members but the ${targetPlan.name} allows ${targetPlan.maxStaffPerStore} per store. Remove ${excess} member(s) before switching.`,
          );
        }
      }
    }
  }
}
