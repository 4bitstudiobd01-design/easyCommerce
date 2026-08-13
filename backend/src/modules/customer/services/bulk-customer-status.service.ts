import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum } from '../entities/customer.entity';
import { BulkCustomerStatusDto } from '../dto/bulk-customer-status.dto';
import { RecordCustomerActivityService } from './record-customer-activity.service';

@Injectable()
export class BulkCustomerStatusService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly recordActivityService: RecordCustomerActivityService,
  ) {}

  async execute(
    tenantId: string,
    dto: BulkCustomerStatusDto,
    actorName = 'Merchant',
  ): Promise<{ affected: number; status: CustomerStatusEnum }> {
    if (!dto.customerIds || dto.customerIds.length === 0) {
      throw new BadRequestException('At least one customer ID must be provided.');
    }

    // De-duplicate customer IDs
    const uniqueIds = Array.from(new Set(dto.customerIds));

    // Fetch tenant-owned matching customers
    const customers = await this.customerRepository.find({
      where: {
        tenantId,
        id: In(uniqueIds),
      },
    });

    if (customers.length === 0) {
      return { affected: 0, status: dto.status };
    }

    const validCustomerIds = customers.map((c) => c.id);

    // Batch update status
    await this.customerRepository.update(
      { tenantId, id: In(validCustomerIds) },
      { status: dto.status },
    );

    // Record activity event for each customer
    for (const cust of customers) {
      if (cust.status !== dto.status) {
        let eventType = 'CUSTOMER_STATUS_CHANGED';
        let title = `Status Changed to ${dto.status}`;

        if (dto.status === CustomerStatusEnum.BLOCKED) {
          eventType = 'CUSTOMER_BLOCKED';
          title = 'Customer Blocked';
        } else if (cust.status === CustomerStatusEnum.BLOCKED && dto.status === CustomerStatusEnum.ACTIVE) {
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
          storeId: cust.storeId,
          customerId: cust.id,
          eventType,
          title,
          description: `Bulk status update from ${cust.status} to ${dto.status}`,
          actorName,
          metadata: { oldStatus: cust.status, newStatus: dto.status, bulk: true },
        });
      }
    }

    return {
      affected: validCustomerIds.length,
      status: dto.status,
    };
  }
}
