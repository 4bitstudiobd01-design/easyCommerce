import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GetTrafficSourcesService,
  TrafficSourceGroupBy,
} from '../../tracking/services/get-traffic-sources.service';
import { MarketingAdSpend, AdSpendDimensionEnum } from '../entities/marketing-ad-spend.entity';
import { MarketingPixel } from '../entities/marketing-pixel.entity';
import {
  MarketingEventLog,
  MarketingEventStatusEnum,
  MarketingEventTransportEnum,
} from '../entities/marketing-event-log.entity';

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

/**
 * Store-wide server-side Purchase delivery health for the report window — one row
 * per capiEnabled pixel. Not per-source (an event log row's utmSource is optional
 * and unreliable to bucket), but per-pixel, so a merchant sees "Meta CAPI: 42
 * delivered / 3 failed" alongside the source table.
 */
export interface PixelDeliveryHealth {
  pixelId: string;
  provider: string;
  label: string | null;
  purchaseSent: number;
  purchaseFailed: number;
}

export interface SourceSalesReport {
  rows: SourceSalesRow[];
  deliveryHealth: PixelDeliveryHealth[];
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
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingEventLog)
    private readonly eventLogRepository: Repository<MarketingEventLog>,
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
  ): Promise<SourceSalesReport> {
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

    const rows: SourceSalesRow[] = trafficRows.map((row) => {
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

    const deliveryHealth = await this.buildDeliveryHealth(tenantId, storeId, dateFrom, dateTo);

    return { rows, deliveryHealth };
  }

  /** Per-pixel server-side Purchase SENT/FAILED counts in the window. */
  private async buildDeliveryHealth(
    tenantId: string,
    storeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<PixelDeliveryHealth[]> {
    const pixels = await this.pixelRepository.find({
      where: { tenantId, storeId, capiEnabled: true },
      order: { provider: 'ASC', createdAt: 'ASC' },
    });
    if (pixels.length === 0) return [];

    const raw = await this.eventLogRepository
      .createQueryBuilder('log')
      .select('log.pixelId', 'pixelId')
      .addSelect('log.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('log.tenantId = :tenantId', { tenantId })
      .andWhere('log.storeId = :storeId', { storeId })
      .andWhere('log.transport = :transport', {
        transport: MarketingEventTransportEnum.SERVER,
      })
      .andWhere('log.eventName = :eventName', { eventName: 'Purchase' })
      .andWhere('log.createdAt >= :dateFrom', { dateFrom })
      .andWhere('log.createdAt <= :dateTo', { dateTo })
      .groupBy('log.pixelId')
      .addGroupBy('log.status')
      .getRawMany<{ pixelId: string; status: string; count: string }>();

    const counts = new Map<string, { sent: number; failed: number }>();
    for (const r of raw) {
      const c = counts.get(r.pixelId) ?? { sent: 0, failed: 0 };
      if (r.status === MarketingEventStatusEnum.SENT) c.sent += Number(r.count);
      else c.failed += Number(r.count);
      counts.set(r.pixelId, c);
    }

    return pixels.map((p) => ({
      pixelId: p.id,
      provider: p.provider,
      label: p.label,
      purchaseSent: counts.get(p.id)?.sent ?? 0,
      purchaseFailed: counts.get(p.id)?.failed ?? 0,
    }));
  }
}
