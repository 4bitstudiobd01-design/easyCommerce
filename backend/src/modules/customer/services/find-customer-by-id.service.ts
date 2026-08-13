import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { roundMoney, averageMoney, toAmount } from '../utils/money.util';

export interface CustomerDetailResponse extends CustomerEntity {
  location: string | null;
  stats: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderAt: string | null;
  };
}

@Injectable()
export class FindCustomerByIdService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(id: string, tenantId: string): Promise<CustomerDetailResponse> {
    const customer = await this.customerRepository.findOne({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }

    // Single aggregated SQL query to fetch exact customer order statistics
    const statsRaw = await this.dataSource.query(
      `
      SELECT 
        COUNT(id)::int AS "totalOrders",
        COUNT(CASE WHEN "orderStatus" IN ('DELIVERED', 'COMPLETED') THEN 1 END)::int AS "completedOrders",
        COUNT(CASE WHEN "orderStatus" = 'CANCELLED' THEN 1 END)::int AS "cancelledOrders",
        COALESCE(SUM(CASE WHEN "orderStatus" NOT IN ('CANCELLED', 'RETURNED') THEN "grandTotal" ELSE 0 END), 0)::numeric AS "totalSpent",
        COUNT(CASE WHEN "orderStatus" NOT IN ('CANCELLED', 'RETURNED') THEN 1 END)::int AS "validOrders",
        MAX("createdAt") AS "lastOrderAt"
      FROM orders
      WHERE "tenantId" = $1
        AND ("customerId" = $2 OR "customerPhone" = $3)
      `,
      [tenantId, customer.id, customer.phone],
    );

    const totalOrders = Number(statsRaw[0]?.totalOrders || 0);
    const completedOrders = Number(statsRaw[0]?.completedOrders || 0);
    const cancelledOrders = Number(statsRaw[0]?.cancelledOrders || 0);
    const validOrders = Number(statsRaw[0]?.validOrders || 0);
    const totalSpent = toAmount(statsRaw[0]?.totalSpent);
    const lastOrderAt = statsRaw[0]?.lastOrderAt ? new Date(statsRaw[0].lastOrderAt).toISOString() : null;

    const avgOrderValue = averageMoney(totalSpent, validOrders);

    // Fetch latest order location if available
    const locationRaw = await this.dataSource.query(
      `
      SELECT city, district, division 
      FROM orders 
      WHERE "tenantId" = $1 
        AND ("customerId" = $2 OR "customerPhone" = $3)
      ORDER BY "createdAt" DESC 
      LIMIT 1
      `,
      [tenantId, customer.id, customer.phone],
    );

    let location: string | null = null;
    if (locationRaw.length > 0) {
      const loc = locationRaw[0];
      const parts = [loc.city || loc.district || loc.division, 'Bangladesh'].filter(Boolean);
      location = parts.join(', ');
    }

    return {
      ...customer,
      location,
      stats: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalSpent: roundMoney(totalSpent),
        avgOrderValue,
        lastOrderAt,
      },
    };
  }
}
