import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { roundMoney, toAmount } from '../utils/money.util';

export interface CustomerKpis {
  totalCustomers: number;
  newCustomers: number;
  avgOrdersPerCustomer: number;
  totalSpent: number;
}

@Injectable()
export class GetCustomerKpiService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(tenantId: string): Promise<CustomerKpis> {
    const totalCustomers = await this.customerRepository.count({
      where: { tenantId },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCustomers = await this.customerRepository.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    // Query aggregated revenue & total non-cancelled orders for tenant
    const orderAgg = await this.dataSource.query(
      `
      SELECT 
        COUNT(id)::int AS "validOrders",
        COALESCE(SUM("grandTotal"), 0)::numeric AS "totalSpent"
      FROM orders
      WHERE "tenantId" = $1
        AND "orderStatus" NOT IN ('CANCELLED', 'RETURNED')
      `,
      [tenantId],
    );

    const validOrders = Number(orderAgg[0]?.validOrders || 0);
    const totalSpent = toAmount(orderAgg[0]?.totalSpent);

    const avgOrdersPerCustomer = totalCustomers > 0 ? Number((validOrders / totalCustomers).toFixed(2)) : 0;

    return {
      totalCustomers,
      newCustomers,
      avgOrdersPerCustomer,
      totalSpent: roundMoney(totalSpent),
    };
  }
}
