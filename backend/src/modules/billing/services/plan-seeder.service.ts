import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity, PlanCodeEnum } from '../entities/plan.entity';

const PLAN_SEED_DATA: Array<Omit<PlanEntity, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    code: PlanCodeEnum.FREE,
    name: 'Free Plan',
    description: 'Perfect for launching your first store — no credit card required.',
    features: [
      'Unlimited product listings',
      'bKash, Nagad, Cards & Cash on Delivery',
      'Steadfast, Pathao, RedX & Paperfly courier booking',
      'Storefront themes and custom pages',
    ],
    displayOrder: 1,
    monthlyPriceBdt: 0,
    maxStores: 1,
    maxStaffPerStore: 3,
    isActive: true,
  },
  {
    code: PlanCodeEnum.GROWTH,
    name: 'Growth Plan',
    description: 'For growing brands running more than one storefront.',
    features: [
      'Everything in Free',
      'Abandoned cart recovery & SMS campaigns',
      'Advanced analytics and reports',
      'Priority support',
    ],
    displayOrder: 2,
    monthlyPriceBdt: 990,
    maxStores: 5,
    maxStaffPerStore: 10,
    isActive: true,
  },
  {
    code: PlanCodeEnum.ENTERPRISE,
    name: 'Enterprise Plan',
    description: 'For high-volume merchants running many stores and teams.',
    features: [
      'Everything in Growth',
      'Unlimited stores and staff members',
      'API access and webhooks',
      'Custom SLA & dedicated support',
    ],
    displayOrder: 3,
    monthlyPriceBdt: 2990,
    maxStores: null,
    maxStaffPerStore: null,
    isActive: true,
  },
];

@Injectable()
export class PlanSeederService implements OnModuleInit {
  private readonly logger = new Logger(PlanSeederService.name);

  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  async onModuleInit() {
    await this.seedPlans();
  }

  async seedPlans() {
    for (const seed of PLAN_SEED_DATA) {
      const existing = await this.planRepository.findOne({ where: { code: seed.code } });

      if (!existing) {
        const plan = this.planRepository.create(seed);
        await this.planRepository.save(plan);
        this.logger.log(`Seeded plan: ${seed.code}`);
        continue;
      }

      // Backfill presentation copy on plans seeded before these columns existed.
      // Pricing and limits are left alone — those are commercial decisions that
      // may have been changed deliberately in the database.
      if (!existing.features?.length || !existing.description || !existing.displayOrder) {
        existing.description = existing.description || seed.description;
        existing.features = existing.features?.length ? existing.features : seed.features;
        existing.displayOrder = existing.displayOrder || seed.displayOrder;
        await this.planRepository.save(existing);
        this.logger.log(`Backfilled plan content: ${seed.code}`);
      }
    }
  }
}
