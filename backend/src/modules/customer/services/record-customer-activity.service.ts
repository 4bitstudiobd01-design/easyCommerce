import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerActivityEntity } from '../entities/customer-activity.entity';

export interface RecordCustomerActivityParams {
  tenantId: string;
  storeId?: string;
  customerId: string;
  eventType: string;
  title: string;
  description?: string;
  actorName?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class RecordCustomerActivityService {
  constructor(
    @InjectRepository(CustomerActivityEntity)
    private readonly activityRepository: Repository<CustomerActivityEntity>,
  ) {}

  async execute(params: RecordCustomerActivityParams): Promise<CustomerActivityEntity> {
    const activity = this.activityRepository.create({
      ...params,
      actorName: params.actorName || 'System',
    });
    return this.activityRepository.save(activity);
  }
}
