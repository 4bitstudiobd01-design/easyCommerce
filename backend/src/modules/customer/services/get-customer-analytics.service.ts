import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum } from '../entities/customer.entity';
import { LeadEntity } from '../entities/lead.entity';
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

export interface RfmBreakdown {
  vip: number;
  loyal: number;
  promising: number;
  atRisk: number;
  dormant: number;
}

export interface AcquisitionChannel {
  channel: string;
  customersCount: number;
  revenue: number;
  percentage: number;
}

export interface TopSpender {
  id: string;
  name: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export interface CrmFullAnalytics {
  // KPIs
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  avgCustomerLtv: number;
  repeatPurchaseRate: number;
  totalRevenue: number;
  avgOrderValue: number;
  churnRate: number;

  // Leads pipeline
  totalLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  pipelineValue: number;

  // Breakdowns
  rfmBreakdown: RfmBreakdown;
  acquisitionChannels: AcquisitionChannel[];
  topSpenders: TopSpender[];
}

@Injectable()
export class GetCustomerAnalyticsService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    private readonly dataSource: DataSource,
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

  async getFullAnalytics(tenantId: string, dto: CustomerAnalyticsQueryDto): Promise<CrmFullAnalytics> {
    const { dateFrom, dateTo } = this.parseDateBoundary(dto);

    // ── 1. Core customer counts ──────────────────────────────────────────────
    const totalCustomers = await this.customerRepository.count({ where: { tenantId } });
    const activeCustomers = await this.customerRepository.count({ where: { tenantId, status: CustomerStatusEnum.ACTIVE } });
    const newCustomers = await this.customerRepository
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.createdAt >= :dateFrom AND c.createdAt <= :dateTo', { dateFrom, dateTo })
      .getCount();

    // ── 2. Revenue & order aggregation ──────────────────────────────────────
    const orderAgg = await this.dataSource.query(
      `SELECT
         COUNT(DISTINCT COALESCE("customerId"::text, "customerPhone"))::int AS "uniqueCustomers",
         COUNT(id)::int AS "totalOrders",
         COALESCE(SUM("grandTotal"), 0)::numeric AS "totalRevenue"
       FROM orders
       WHERE "tenantId" = $1
         AND "orderStatus" NOT IN ('CANCELLED', 'RETURNED')
         AND "createdAt" >= $2 AND "createdAt" <= $3`,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    // ── 3. Repeat customers ──────────────────────────────────────────────────
    const repeatAgg = await this.dataSource.query(
      `SELECT COUNT(*)::int AS "repeatCustomers"
       FROM (
         SELECT COALESCE("customerId"::text, "customerPhone"), COUNT(id) AS cnt
         FROM orders
         WHERE "tenantId" = $1
           AND "orderStatus" NOT IN ('CANCELLED', 'RETURNED')
           AND "createdAt" >= $2 AND "createdAt" <= $3
         GROUP BY COALESCE("customerId"::text, "customerPhone")
         HAVING COUNT(id) > 1
       ) sub`,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    const totalRevenue = toAmount(orderAgg[0]?.totalRevenue);
    const totalOrders = Number(orderAgg[0]?.totalOrders || 0);
    const uniqueWithOrders = Number(orderAgg[0]?.uniqueCustomers || 0);
    const repeatCustomers = Number(repeatAgg[0]?.repeatCustomers || 0);
    const avgOrderValue = averageMoney(totalRevenue, totalOrders);
    const avgCustomerLtv = averageMoney(totalRevenue, uniqueWithOrders || totalCustomers || 1);
    const repeatPurchaseRate = uniqueWithOrders > 0
      ? Math.round((repeatCustomers / uniqueWithOrders) * 1000) / 10
      : 0;

    // ── 4. Churn rate (inactive >90 days but has orders) ───────────────────
    const churnAgg = await this.dataSource.query(
      `SELECT COUNT(DISTINCT COALESCE(o."customerId"::text, o."customerPhone"))::int AS "churnedCount"
       FROM orders o
       WHERE o."tenantId" = $1
         AND o."orderStatus" NOT IN ('CANCELLED', 'RETURNED')
       GROUP BY COALESCE(o."customerId"::text, o."customerPhone")
       HAVING MAX(o."createdAt") < NOW() - INTERVAL '90 days'`,
      [tenantId],
    );
    const churnedCount = churnAgg.length;
    const churnRate = uniqueWithOrders > 0
      ? Math.round((churnedCount / Math.max(uniqueWithOrders, 1)) * 1000) / 10
      : 0;

    // ── 5. Leads pipeline ───────────────────────────────────────────────────
    const leadsAgg = await this.dataSource.query(
      `SELECT
         COUNT(id)::int AS "totalLeads",
         COUNT(CASE WHEN stage = 'WON' THEN 1 END)::int AS "wonLeads",
         COALESCE(SUM(CASE WHEN stage NOT IN ('LOST') THEN estimated_value ELSE 0 END), 0)::numeric AS "pipelineValue"
       FROM crm_leads
       WHERE tenant_id = $1`,
      [tenantId],
    );
    const totalLeads = Number(leadsAgg[0]?.totalLeads || 0);
    const convertedLeads = Number(leadsAgg[0]?.wonLeads || 0);
    const leadConversionRate = totalLeads > 0
      ? Math.round((convertedLeads / totalLeads) * 1000) / 10
      : 0;
    const pipelineValue = roundMoney(leadsAgg[0]?.pipelineValue);

    // ── 6. RFM Breakdown (based on all customers and their order history) ───
    const rfmAgg = await this.dataSource.query(
      `SELECT
         COUNT(DISTINCT CASE
           WHEN total_spent >= 20000 AND orders_count >= 3 THEN cust_key
         END)::int AS "vip",
         COUNT(DISTINCT CASE
           WHEN total_spent < 20000 AND orders_count >= 3 THEN cust_key
         END)::int AS "loyal",
         COUNT(DISTINCT CASE
           WHEN orders_count BETWEEN 1 AND 2 AND days_since_last < 45 THEN cust_key
         END)::int AS "promising",
         COUNT(DISTINCT CASE
           WHEN orders_count >= 1 AND days_since_last BETWEEN 45 AND 89 THEN cust_key
         END)::int AS "atRisk",
         COUNT(DISTINCT CASE
           WHEN orders_count = 0 OR days_since_last >= 90 THEN cust_key
         END)::int AS "dormant"
       FROM (
         SELECT
           c.id AS cust_key,
           COUNT(DISTINCT o.id) AS orders_count,
           COALESCE(SUM(CASE WHEN o."orderStatus" NOT IN ('CANCELLED','RETURNED') THEN o."grandTotal" ELSE 0 END), 0) AS total_spent,
           COALESCE(EXTRACT(DAY FROM NOW() - MAX(o."createdAt")), 999) AS days_since_last
         FROM customers c
         LEFT JOIN orders o
           ON o."tenantId" = c."tenantId"
          AND (o."customerId" = c.id OR (o."customerId" IS NULL AND o."customerPhone" = c.phone))
         WHERE c."tenantId" = $1
         GROUP BY c.id
       ) rfm`,
      [tenantId],
    );

    const rfmBreakdown: RfmBreakdown = {
      vip: Number(rfmAgg[0]?.vip || 0),
      loyal: Number(rfmAgg[0]?.loyal || 0),
      promising: Number(rfmAgg[0]?.promising || 0),
      atRisk: Number(rfmAgg[0]?.atRisk || 0),
      dormant: Number(rfmAgg[0]?.dormant || 0),
    };

    // ── 7. Acquisition channels (by customer source) ────────────────────────
    const sourceRevAgg = await this.dataSource.query(
      `SELECT
         c.source,
         COUNT(DISTINCT c.id)::int AS "custCount",
         COALESCE(SUM(CASE WHEN o."orderStatus" NOT IN ('CANCELLED','RETURNED') THEN o."grandTotal" ELSE 0 END), 0)::numeric AS "revenue"
       FROM customers c
       LEFT JOIN orders o
         ON o."tenantId" = c."tenantId"
        AND (o."customerId" = c.id OR (o."customerId" IS NULL AND o."customerPhone" = c.phone))
       WHERE c."tenantId" = $1
       GROUP BY c.source
       ORDER BY revenue DESC`,
      [tenantId],
    );

    const sourceChannelMap: Record<string, string> = {
      ONLINE_STORE: 'Online Storefront',
      FACEBOOK: 'Facebook / Instagram Ads',
      INSTAGRAM: 'Facebook / Instagram Ads',
      WHATSAPP: 'WhatsApp Commerce',
      PHONE_CALL: 'Direct Phone & POS',
      MANUAL: 'Direct Phone & POS',
      STORE_INQUIRY: 'Direct Phone & POS',
      EMAIL: 'Email Marketing',
      GOOGLE: 'Google Ads',
    };

    const channelMap = new Map<string, { customersCount: number; revenue: number }>();
    for (const row of sourceRevAgg) {
      const channelName = sourceChannelMap[row.source] || row.source.replace(/_/g, ' ');
      const existing = channelMap.get(channelName) || { customersCount: 0, revenue: 0 };
      channelMap.set(channelName, {
        customersCount: existing.customersCount + Number(row.custCount || 0),
        revenue: existing.revenue + Number(row.revenue || 0),
      });
    }

    const totalChannelRevenue = Array.from(channelMap.values()).reduce((sum, ch) => sum + ch.revenue, 0);
    const acquisitionChannels: AcquisitionChannel[] = Array.from(channelMap.entries())
      .map(([channel, data]) => ({
        channel,
        customersCount: data.customersCount,
        revenue: roundMoney(data.revenue),
        percentage: totalChannelRevenue > 0
          ? Math.round((data.revenue / totalChannelRevenue) * 1000) / 10
          : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // ── 8. Top spenders leaderboard ─────────────────────────────────────────
    const topSpendersRaw = await this.dataSource.query(
      `SELECT
         c.id,
         c."firstName",
         c."lastName",
         c.phone,
         COUNT(DISTINCT o.id)::int AS "ordersCount",
         COALESCE(SUM(CASE WHEN o."orderStatus" NOT IN ('CANCELLED','RETURNED') THEN o."grandTotal" ELSE 0 END), 0)::numeric AS "totalSpent",
         MAX(o."createdAt") AS "lastOrderAt"
       FROM customers c
       LEFT JOIN orders o
         ON o."tenantId" = c."tenantId"
        AND (o."customerId" = c.id OR (o."customerId" IS NULL AND o."customerPhone" = c.phone))
       WHERE c."tenantId" = $1
       GROUP BY c.id, c."firstName", c."lastName", c.phone
       ORDER BY "totalSpent" DESC, "ordersCount" DESC
       LIMIT 10`,
      [tenantId],
    );

    const topSpenders: TopSpender[] = topSpendersRaw.map((r: any) => ({
      id: r.id,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Valued Customer',
      phone: r.phone,
      ordersCount: Number(r.ordersCount || 0),
      totalSpent: roundMoney(r.totalSpent),
      lastOrderAt: r.lastOrderAt
        ? new Date(r.lastOrderAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'No orders yet',
    }));

    return {
      totalCustomers,
      activeCustomers,
      newCustomers,
      repeatCustomers,
      avgCustomerLtv: roundMoney(avgCustomerLtv),
      repeatPurchaseRate,
      totalRevenue: roundMoney(totalRevenue),
      avgOrderValue: roundMoney(avgOrderValue),
      churnRate,
      totalLeads,
      convertedLeads,
      leadConversionRate,
      pipelineValue,
      rfmBreakdown,
      acquisitionChannels,
      topSpenders,
    };
  }

  async getOverview(tenantId: string, dto: CustomerAnalyticsQueryDto): Promise<CustomerAnalyticsOverview> {
    const full = await this.getFullAnalytics(tenantId, dto);
    return {
      totalCustomers: full.totalCustomers,
      newCustomers: full.newCustomers,
      activeCustomers: full.activeCustomers,
      repeatCustomers: full.repeatCustomers,
      totalRevenue: full.totalRevenue,
      avgOrderValue: full.avgOrderValue,
      avgCustomerLtv: full.avgCustomerLtv,
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
