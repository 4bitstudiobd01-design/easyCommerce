import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum } from '../entities/customer.entity';
import { UpdateCustomerStatusDto } from '../dto/update-customer-status.dto';
import { RecordCustomerActivityService } from './record-customer-activity.service';

@Injectable()
export class UpdateCustomerStatusService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly recordActivityService: RecordCustomerActivityService,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    dto: UpdateCustomerStatusDto,
    actorName = 'Merchant',
  ): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findOne({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }

    const oldStatus = customer.status;
    customer.status = dto.status;
    const savedCustomer = await this.customerRepository.save(customer);

    // Record activity event
    if (oldStatus !== dto.status) {
      let eventType = 'CUSTOMER_STATUS_CHANGED';
      let title = `Status Changed to ${dto.status}`;

      if (dto.status === CustomerStatusEnum.BLOCKED) {
        eventType = 'CUSTOMER_BLOCKED';
        title = 'Customer Blocked';
      } else if (oldStatus === CustomerStatusEnum.BLOCKED && dto.status === CustomerStatusEnum.ACTIVE) {
        eventType = 'CUSTOMER_UNBLOCKED';
        title = 'Customer Unblocked';
      } else if (dto.status === CustomerStatusEnum.ACTIVE) {
        eventType = 'CUSTOMER_ACTIVATED';
        title = 'Customer Activated';
      } else if (dto.status === CustomerStatusEnum.INACTIVE) {
        eventType = 'CUSTOMER_DEACTIVATED';
        title = 'Customer Deactivated';
      }

      await this.recordActivityService.execute({
        tenantId,
        storeId: customer.storeId,
        customerId: customer.id,
        eventType,
        title,
        description: `Customer status updated from ${oldStatus} to ${dto.status}`,
        actorName,
        metadata: { oldStatus, newStatus: dto.status },
      });
    }

    return savedCustomer;
  }
}
