import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';

@Injectable()
export class ListPlansService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  async execute(): Promise<PlanEntity[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', monthlyPriceBdt: 'ASC' },
    });
  }
}
