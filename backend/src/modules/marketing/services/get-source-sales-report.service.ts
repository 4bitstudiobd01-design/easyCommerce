import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GetTrafficSourcesService,
  TrafficSourceGroupBy,
} from '../../tracking/services/get-traffic-sources.service';
import { MarketingAdSpend, AdSpendDimensionEnum } from '../entities/marketing-ad-spend.entity';

export interface SourceSalesRow {
  dimension: TrafficSourceGroupBy;
  dimensionValue: string;
  sessions: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  spend: number;
  currency: string | null;
  /** revenue / spend — null when spend is 0 or no overlapping ad-spend entry. */
  roas: number | null;
  /** spend / orders — null when spend is 0/absent or there were no orders. */
  cpa: number | null;
}

const GROUP_BY_TO_DIMENSION: Record<TrafficSourceGroupBy, AdSpendDimensionEnum> = {
  channel: AdSpendDimensionEnum.CHANNEL,
  source: AdSpendDimensionEnum.SOURCE,
  campaign: AdSpendDimensionEnum.CAMPAIGN,
};

@Injectable()
export class GetSourceSalesReportService {
  constructor(
    private readonly getTrafficSourcesService: GetTrafficSourcesService,
    @InjectRepository(MarketingAdSpend)
    private readonly adSpendRepository: Repository<MarketingAdSpend>,
  ) {}

  /**
   * The Sales-by-Source table: the grouped traffic-source rows (sessions, orders,
   * revenue, conversion rate — from GetTrafficSourcesService's exact session⨝order
   * join) joined in memory to any MarketingAdSpend entry for the same dimension +
   * value whose [periodStart, periodEnd] overlaps the report window, to produce
   * spend, ROAS and CPA.
   */
  async execute(
    tenantId: string,
    storeId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: TrafficSourceGroupBy = 'channel',
  ): Promise<SourceSalesRow[]> {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId headers are required');
    }

    const trafficRows = await this.getTrafficSourcesService.execute(
      tenantId,
      dateFrom,
      dateTo,
      groupBy,
    );

    const windowStart = dateFrom.toISOString().slice(0, 10);
    const windowEnd = dateTo.toISOString().slice(0, 10);

    // All spend entries for this dimension whose period overlaps the window.
    const spendEntries = await this.adSpendRepository
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.storeId = :storeId', { storeId })
      .andWhere('s.dimension = :dimension', {
        dimension: GROUP_BY_TO_DIMENSION[groupBy],
      })
      .andWhere('s.periodStart <= :windowEnd', { windowEnd })
      .andWhere('s.periodEnd >= :windowStart', { windowStart })
      .getMany();

    // Sum spend per dimensionValue (a value may have several entries in the window).
    const spendByValue = new Map<string, { amount: number; currency: string }>();
    for (const entry of spendEntries) {
      const key = entry.dimensionValue;
      const prev = spendByValue.get(key);
      const amount = Number(entry.amount);
      if (prev) {
        prev.amount += amount;
      } else {
        spendByValue.set(key, { amount, currency: entry.currency });
      }
    }

    return trafficRows.map((row) => {
      const spendInfo = spendByValue.get(row.dimensionValue);
      const spend = spendInfo ? spendInfo.amount : 0;
      const roas = spend > 0 ? Math.round((row.revenue / spend) * 100) / 100 : null;
      const cpa =
        spend > 0 && row.orders > 0 ? Math.round((spend / row.orders) * 100) / 100 : null;

      return {
        dimension: row.dimension,
        dimensionValue: row.dimensionValue,
        sessions: row.sessions,
        orders: row.orders,
        revenue: row.revenue,
        conversionRate: row.conversionRate,
        spend,
        currency: spendInfo ? spendInfo.currency : null,
        roas,
        cpa,
      };
    });
  }
}
