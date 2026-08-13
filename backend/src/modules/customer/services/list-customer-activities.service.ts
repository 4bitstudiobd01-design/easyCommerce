import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerActivityEntity } from '../entities/customer-activity.entity';
import { CustomerEntity } from '../entities/customer.entity';

export interface CustomerActivityItem {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  actorName: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ListCustomerActivitiesService {
  constructor(
    @InjectRepository(CustomerActivityEntity)
    private readonly activityRepository: Repository<CustomerActivityEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(customerId: string, tenantId: string): Promise<CustomerActivityItem[]> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    // 1. Fetch explicitly recorded activities
    const dbActivities = await this.activityRepository.find({
      where: { customerId, tenantId },
      order: { createdAt: 'DESC' },
    });

    const items: CustomerActivityItem[] = dbActivities.map((a) => ({
      id: a.id,
      eventType: a.eventType,
      title: a.title,
      description: a.description,
      actorName: a.actorName,
      createdAt: new Date(a.createdAt).toISOString(),
      metadata: a.metadata,
    }));

    // 2. Synthesize base customer creation activity event
    items.push({
      id: `cust-created-${customer.id}`,
      eventType: 'CUSTOMER_CREATED',
      title: 'Customer Profile Created',
      description: `Acquired via ${customer.source.replace(/_/g, ' ')}`,
      actorName: 'System',
      createdAt: new Date(customer.createdAt).toISOString(),
    });

    // 3. Synthesize order activity events for this customer
    const orderEventsRaw = await this.dataSource.query(
      `
      SELECT 
        o.id AS "orderId",
        o."orderNumber",
        o."orderStatus",
        o."grandTotal",
        o."createdAt"
      FROM orders o
      WHERE o."tenantId" = $1 AND (o."customerId" = $2 OR o."customerPhone" = $3)
      ORDER BY o."createdAt" DESC
      LIMIT 20
      `,
      [tenantId, customer.id, customer.phone],
    );

    for (const ord of orderEventsRaw) {
      items.push({
        id: `order-placed-${ord.orderId}`,
        eventType: 'ORDER_PLACED',
        title: `Placed Order ${ord.orderNumber}`,
        description: `Grand Total: ৳${Number(ord.grandTotal || 0).toLocaleString()} (${ord.orderStatus.replace(/_/g, ' ')})`,
        actorName: customer.firstName || 'Customer',
        createdAt: new Date(ord.createdAt).toISOString(),
        metadata: { orderId: ord.orderId, orderNumber: ord.orderNumber },
      });
    }

    // 4. Sort unified timeline by createdAt DESC
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return items;
  }
}
