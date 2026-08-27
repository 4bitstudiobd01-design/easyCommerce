import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { CustomerActivityEntity } from '../entities/customer-activity.entity';
import { LogCustomerActivityDto } from '../dto/log-customer-activity.dto';
import { RecordCustomerActivityService } from './record-customer-activity.service';

/**
 * Manual/staff-initiated interaction logging (e.g. "called customer", "sent WhatsApp",
 * "met in person"), as opposed to the automated domain-event activities recorded via
 * RecordCustomerActivityService directly from order/lead/note flows. Validates the
 * customer belongs to the tenant, then delegates the actual persistence to
 * RecordCustomerActivityService so both paths share one source of truth.
 */
@Injectable()
export class LogCustomerActivityService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly recordActivityService: RecordCustomerActivityService,
  ) {}

  async execute(
    customerId: string,
    tenantId: string,
    dto: LogCustomerActivityDto,
    actorName = 'Merchant',
    storeId?: string,
  ): Promise<CustomerActivityEntity> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    return this.recordActivityService.execute({
      tenantId,
      storeId: storeId || customer.storeId,
      customerId,
      eventType: dto.type,
      title: dto.title,
      description: dto.description,
      actorName,
      metadata: dto.outcome ? { outcome: dto.outcome } : undefined,
    });
  }
}
