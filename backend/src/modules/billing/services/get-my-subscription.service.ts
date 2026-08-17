import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity, SubscriptionStatusEnum } from '../entities/subscription.entity';
import { PlanEntity, PlanCodeEnum } from '../entities/plan.entity';

export interface SubscriptionSnapshot {
  subscription: SubscriptionEntity;
  plan: PlanEntity;
  /** The plan a scheduled downgrade will move to, if one is pending. */
  pendingPlan: PlanEntity | null;
}

@Injectable()
export class GetMySubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  async execute(tenantId: string): Promise<SubscriptionSnapshot> {
    let subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });

    if (!subscription) {
      const freePlan = await this.planRepository.findOne({ where: { code: PlanCodeEnum.FREE } });
      if (!freePlan) {
        throw new NotFoundException('Free plan is not configured.');
      }

      const now = new Date();
      const farFuture = new Date('2099-12-31');

      subscription = this.subscriptionRepository.create({
        tenantId,
        planId: freePlan.id,
        status: SubscriptionStatusEnum.ACTIVE,
        currentPeriodStart: now,
        // Free plan never expires — it isn't billed, so there's no renewal cycle.
        currentPeriodEnd: farFuture,
        gracePeriodEndsAt: null,
      });
      subscription = await this.subscriptionRepository.save(subscription);

      return { subscription, plan: freePlan, pendingPlan: null };
    }

    const plan = await this.planRepository.findOne({ where: { id: subscription.planId } });
    if (!plan) {
      throw new NotFoundException('Subscription references a plan that no longer exists.');
    }

    const pendingPlan = subscription.pendingPlanId
      ? await this.planRepository.findOne({ where: { id: subscription.pendingPlanId } })
      : null;

    return { subscription, plan, pendingPlan: pendingPlan ?? null };
  }
}
