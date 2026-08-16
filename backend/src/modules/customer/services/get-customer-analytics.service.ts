import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum } from '../entities/customer.entity';
import { CustomerAnalyticsQueryDto } from '../dto/customer-analytics.dto';
import { roundMoney, averageMoney, toAmount } from '../utils/money.util';

export interface CustomerAnalyticsOverview {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  repeatCustomers: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgCustomerLtv: number;
}

export interface CustomerSourceDistributionItem {
  source: string;
  count: number;
  percentage: number;
}

export interface CustomerTrendPoint {
  date: string;
  newCustomers: number;
  revenue: number;
}

export interface TopCustomerItem {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderAt: string | null;
}

export interface NewVsReturningTrendPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface NewVsReturningSummary {
  newCustomers: number;
  returningCustomers: number;
  newPercentage: number;
  returningPercentage: number;
}

@Injectable()
export class GetCustomerAnalyticsService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  private parseDateBoundary(dto: CustomerAnalyticsQueryDto): { dateFrom: Date; dateTo: Date } {
    const now = new Date();
    let dateTo = new Date();
    let dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days

    if (dto.dateRange === 'ALL') {
      dateFrom = new Date(0); // Beginning of epoch for All Time
    } else if (dto.dateFrom) {
      dateFrom = new Date(dto.dateFrom);
    } else if (dto.dateRange && dto.dateRange !== 'ALL') {
      const days = parseInt(dto.dateRange, 10);
      if (Number.isFinite(days) && days > 0) {
        dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }
    }

    if (dto.dateTo) {
      dateTo = new Date(dto.dateTo);
    }

    return { dateFrom, dateTo };
  }

  async getOverview(tenantId: string, dto: CustomerAnalyticsQueryDto): Promise<CustomerAnalyticsOverview> {
    const { dateFrom, dateTo } = this.parseDateBoundary(dto);

    // 1. Total Customers Count (all time for tenant)
    const totalCustomersRes = await this.customerRepository.count({ where: { tenantId } });

    // 2. New Customers Count (created within date range)
    const newCustomersQb = this.customerRepository.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.createdAt >= :dateFrom AND c.createdAt <= :dateTo', { dateFrom, dateTo });

    if (dto.source) newCustomersQb.andWhere('c.source = :source', { source: dto.source });
    if (dto.status) newCustomersQb.andWhere('c.status = :status', { status: dto.status });
    const newCustomers = await newCustomersQb.getCount();

    // 3. Active Customers Count
    const activeCustomers = await this.customerRepository.count({
      where: { tenantId, status: CustomerStatusEnum.ACTIVE },
    });

    // 4. Order Revenue Aggregations from Orders table
    const orderAggRaw = await this.customerRepository.manager.query(
      `
      SELECT
        COUNT(DISTINCT CASE WHEN "customerPhone" IS NOT NULL OR "customerId" IS NOT NULL THEN COALESCE("customerId"::text, "customerPhone") END)::int AS "uniqueCustomersWithOrders",
        COUNT(id)::int AS "totalOrdersCount",
        COALESCE(SUM("grandTotal"), 0)::numeric AS "totalRevenue",
        COUNT(CASE WHEN "repeatCount" > 1 THEN 1 END)::int AS "repeatCountRaw"
      FROM (
        SELECT
          id,
          "customerId",
          "customerPhone",
          "grandTotal",
          COUNT(*) OVER(PARTITION BY COALESCE("customerId"::text, "customerPhone")) AS "repeatCount"
        FROM orders
        WHERE "tenantId" = $1
          AND "orderStatus" NOT IN ('CANCELLED', 'RETURNED')
          AND "createdAt" >= $2 AND "createdAt" <= $3
      ) sub
      `,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    const repeatCustRaw = await this.customerRepository.manager.query(
      `
      SELECT COUNT(cnt)::int AS "repeatCustomers"
      FROM (
        SELECT COALESCE("customerId"::text, "customerPhone"), COUNT(id) AS cnt
        FROM orders
        WHERE "tenantId" = $1
          AND "orderStatus" NOT IN ('CANCELLED', 'RETURNED')
          AND "createdAt" >= $2 AND "createdAt" <= $3
        GROUP BY COALESCE("customerId"::text, "customerPhone")
        HAVING COUNT(id) > 1
      ) sub
      `,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    const customersInWindow = await this.customerRepository
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.createdAt >= :dateFrom AND c.createdAt <= :dateTo', { dateFrom, dateTo })
      .getCount();

    const totalRevenue = toAmount(orderAggRaw[0]?.totalRevenue);
    const totalOrdersCount = Number(orderAggRaw[0]?.totalOrdersCount || 0);
    const repeatCustomers = Number(repeatCustRaw[0]?.repeatCustomers || 0);

    const avgOrderValue = averageMoney(totalRevenue, totalOrdersCount);
    const avgCustomerLtv = averageMoney(totalRevenue, customersInWindow || totalCustomersRes);

    return {
      totalCustomers: totalCustomersRes,
      newCustomers,
      activeCustomers,
      repeatCustomers,
      totalRevenue: roundMoney(totalRevenue),
      avgOrderValue,
      avgCustomerLtv,
    };
  }

  async getSourceDistribution(tenantId: string): Promise<CustomerSourceDistributionItem[]> {
    const total = await this.customerRepository.count({ where: { tenantId } });

    const raw = await this.customerRepository.createQueryBuilder('c')
      .select('c.source', 'source')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.tenantId = :tenantId', { tenantId })
      .groupBy('c.source')
      .getRawMany();

    return raw.map((r) => {
      const cnt = Number(r.count || 0);
      const percentage = total > 0 ? Math.round((cnt / total) * 1000) / 10 : 0;
      return {
        source: r.source,
        count: cnt,
        percentage,
      };
    });
  }

  async getTrendData(tenantId: string, dto: CustomerAnalyticsQueryDto): Promise<CustomerTrendPoint[]> {
    const { dateFrom, dateTo } = this.parseDateBoundary(dto);

    // 1. Daily new customers trend
    const growthRaw = await this.customerRepository.manager.query(
      `
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') AS "dateStr",
        COUNT(id)::int AS "cnt"
      FROM customers
      WHERE "tenantId" = $1
        AND "createdAt" >= $2 AND "createdAt" <= $3
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY "dateStr" ASC
      `,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    // 2. Daily revenue trend
    const revenueRaw = await this.customerRepository.manager.query(
      `
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') AS "dateStr",
        COALESCE(SUM("grandTotal"), 0)::numeric AS "rev"
      FROM orders
      WHERE "tenantId" = $1
        AND "orderStatus" NOT IN ('CANCELLED', 'RETURNED')
        AND "createdAt" >= $2 AND "createdAt" <= $3
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY "dateStr" ASC
      `,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    const growthMap = new Map<string, number>(growthRaw.map((r: any) => [r.dateStr, Number(r.cnt || 0)]));
    const revenueMap = new Map<string, number>(revenueRaw.map((r: any) => [r.dateStr, Number(r.rev || 0)]));

    const trendPoints: CustomerTrendPoint[] = [];
    const curr = new Date(dateFrom);

    while (curr <= dateTo) {
      const dateStr = curr.toISOString().split('T')[0];
      trendPoints.push({
        date: dateStr,
        newCustomers: growthMap.get(dateStr) || 0,
        revenue: roundMoney(revenueMap.get(dateStr) || 0),
      });
      curr.setDate(curr.getDate() + 1);
    }

    return trendPoints;
  }

  /**
   * Classifies each order as "new" (the customer's first-ever order) or
   * "returning" (any later order), then buckets counts per day within the
   * window. The rank must be computed over the customer's ENTIRE order
   * history — not just the window — otherwise a returning customer whose
   * first order predates the window gets misclassified as new on their
   * first in-window order. The window filter is applied only in the outer
   * query, after ranking.
   */
  async getNewVsReturningTrend(tenantId: string, days = 7): Promise<NewVsReturningTrendPoint[]> {
    const dateTo = new Date();
    const dateFrom = new Date(dateTo.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    dateFrom.setHours(0, 0, 0, 0);

    const raw = await this.customerRepository.manager.query(
      `
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM-DD') AS "dateStr",
        COUNT(CASE WHEN "orderRank" = 1 THEN 1 END)::int AS "newCount",
        COUNT(CASE WHEN "orderRank" > 1 THEN 1 END)::int AS "returningCount"
      FROM (
        SELECT
          id,
          "createdAt",
          RANK() OVER (PARTITION BY COALESCE("customerId"::text, "customerPhone") ORDER BY "createdAt") AS "orderRank"
        FROM orders
        WHERE "tenantId" = $1
          AND "orderStatus" NOT IN ('CANCELLED', 'RETURNED')
      ) ranked
      WHERE "createdAt" >= $2 AND "createdAt" <= $3
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY "dateStr" ASC
      `,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    const byDate = new Map<string, { newCustomers: number; returningCustomers: number }>(
      raw.map((r: any) => [
        r.dateStr,
        { newCustomers: Number(r.newCount || 0), returningCustomers: Number(r.returningCount || 0) },
      ]),
    );

    const points: NewVsReturningTrendPoint[] = [];
    const cursor = new Date(dateFrom);
    while (cursor <= dateTo) {
      const dateStr = cursor.toISOString().split('T')[0];
      const bucket = byDate.get(dateStr);
      points.push({
        date: dateStr,
        newCustomers: bucket?.newCustomers || 0,
        returningCustomers: bucket?.returningCustomers || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return points;
  }

  /**
   * Customer-headcount split (distinct customers, not order counts) for the
   * donut chart. "New" is defined the same way as the trend above — a
   * customer's first-ever order landing inside the window — so the two
   * widgets stay consistent with each other rather than using a different
   * "created in range" definition.
   */
  async getNewVsReturningSummary(tenantId: string, dto: CustomerAnalyticsQueryDto): Promise<NewVsReturningSummary> {
    const { dateFrom, dateTo } = this.parseDateBoundary(dto);

    const raw = await this.customerRepository.manager.query(
      `
      SELECT
        COUNT(DISTINCT CASE WHEN "orderRank" = 1 THEN "customerKey" END)::int AS "newCount",
        COUNT(DISTINCT CASE WHEN "orderRank" > 1 THEN "customerKey" END)::int AS "returningCount"
      FROM (
        SELECT
          COALESCE("customerId"::text, "customerPhone") AS "customerKey",
          "createdAt",
          RANK() OVER (PARTITION BY COALESCE("customerId"::text, "customerPhone") ORDER BY "createdAt") AS "orderRank"
        FROM orders
        WHERE "tenantId" = $1
          AND "orderStatus" NOT IN ('CANCELLED', 'RETURNED')
      ) ranked
      WHERE "createdAt" >= $2 AND "createdAt" <= $3
      `,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    const newCustomers = Number(raw[0]?.newCount || 0);
    const returningCustomers = Number(raw[0]?.returningCount || 0);
    const total = newCustomers + returningCustomers;

    return {
      newCustomers,
      returningCustomers,
      newPercentage: total > 0 ? Math.round((newCustomers / total) * 1000) / 10 : 0,
      returningPercentage: total > 0 ? Math.round((returningCustomers / total) * 1000) / 10 : 0,
    };
  }

  async getTopCustomers(tenantId: string, limit = 10): Promise<TopCustomerItem[]> {
    const raw = await this.customerRepository.manager.query(
      `
      SELECT 
        c.id,
        c."firstName",
        c."lastName",
        c.email,
        c.phone,
        COUNT(o.id)::int AS "ordersCount",
        COALESCE(SUM(CASE WHEN o."orderStatus" NOT IN ('CANCELLED', 'RETURNED') THEN o."grandTotal" ELSE 0 END), 0)::numeric AS "totalSpent",
        MAX(o."createdAt") AS "lastOrderAt"
      FROM customers c
      LEFT JOIN orders o 
        ON o."tenantId" = c."tenantId" 
       AND (o."customerId" = c.id OR o."customerPhone" = c.phone)
      WHERE c."tenantId" = $1
      GROUP BY c.id, c."firstName", c."lastName", c.email, c.phone
      ORDER BY "totalSpent" DESC, "ordersCount" DESC
      LIMIT $2
      `,
      [tenantId, limit],
    );

    return raw.map((r: any) => {
      const ordersCount = Number(r.ordersCount || 0);
      const totalSpent = roundMoney(r.totalSpent);
      const avgOrderValue = averageMoney(totalSpent, ordersCount);

      return {
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        phone: r.phone,
        ordersCount,
        totalSpent,
        avgOrderValue,
        lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : null,
      };
    });
  }
}
