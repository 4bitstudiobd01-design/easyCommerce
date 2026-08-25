import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity, PlanCodeEnum } from '../entities/plan.entity';

const PLAN_SEED_DATA: Array<Omit<PlanEntity, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    code: PlanCodeEnum.FREE,
    name: 'Free Plan',
    monthlyPriceBdt: 0,
    maxStores: 1,
    maxStaffPerStore: 3,
    isActive: true,
  },
  {
    code: PlanCodeEnum.GROWTH,
    name: 'Growth Plan',
    monthlyPriceBdt: 990,
    maxStores: 5,
    maxStaffPerStore: 10,
    isActive: true,
  },
  {
    code: PlanCodeEnum.ENTERPRISE,
    name: 'Enterprise Plan',
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
    try {
      await this.seedPlans();
    } catch (err: any) {
      this.logger.warn(`Plan seeder note: ${err?.message}`);
    }
  }

  async seedPlans() {
    for (const seed of PLAN_SEED_DATA) {
      const existing = await this.planRepository.findOne({ where: { code: seed.code } });
      if (!existing) {
        const plan = this.planRepository.create(seed);
        await this.planRepository.save(plan);
        this.logger.log(`Seeded plan: ${seed.code}`);
      }
    }
  }
}
