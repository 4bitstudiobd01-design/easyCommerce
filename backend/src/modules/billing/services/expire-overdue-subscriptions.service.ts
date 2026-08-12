import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionEntity, SubscriptionStatusEnum } from '../entities/subscription.entity';
import { PlanEntity, PlanCodeEnum } from '../entities/plan.entity';

const GRACE_PERIOD_DAYS = 3;

@Injectable()
export class ExpireOverdueSubscriptionsService {
  private readonly logger = new Logger(ExpireOverdueSubscriptionsService.name);

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    await this.execute();
  }

  async execute(): Promise<{ markedPastDue: number; downgradedToFree: number }> {
    const now = new Date();
    let markedPastDue = 0;
    let downgradedToFree = 0;

    // 1. Active paid subscriptions whose period has ended enter a grace period.
    const overdueActive = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatusEnum.ACTIVE,
        currentPeriodEnd: LessThanOrEqual(now),
      },
    });

    for (const sub of overdueActive) {
      const plan = await this.planRepository.findOne({ where: { id: sub.planId } });
      if (!plan || plan.code === PlanCodeEnum.FREE) continue; // Free plan never expires

      const graceEnd = new Date(sub.currentPeriodEnd);
      graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

      sub.status = SubscriptionStatusEnum.PAST_DUE;
      sub.gracePeriodEndsAt = graceEnd;
      await this.subscriptionRepository.save(sub);
      markedPastDue++;
    }

    // 2. Subscriptions whose grace period has elapsed get stepped down to Free.
    const freePlan = await this.planRepository.findOne({ where: { code: PlanCodeEnum.FREE } });

    if (freePlan) {
      const pastDueExpired = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatusEnum.PAST_DUE,
          gracePeriodEndsAt: LessThanOrEqual(now),
        },
      });

      for (const sub of pastDueExpired) {
        sub.planId = freePlan.id;
        sub.status = SubscriptionStatusEnum.EXPIRED;
        sub.gracePeriodEndsAt = null;
        await this.subscriptionRepository.save(sub);
        downgradedToFree++;
      }
    }

    if (markedPastDue || downgradedToFree) {
      this.logger.log(
        `Subscription sweep: ${markedPastDue} marked PAST_DUE, ${downgradedToFree} downgraded to Free.`,
      );
    }

    return { markedPastDue, downgradedToFree };
  }
}
