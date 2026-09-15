import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorefrontSessionEntity } from '../entities/storefront-session.entity';

export type TrafficSourceGroupBy = 'channel' | 'source' | 'campaign';

export interface TrafficSourceRow {
  /** Which breakdown this row represents — mirrors the requested `groupBy`. */
  dimension: TrafficSourceGroupBy;
  /** The concrete grouped value (e.g. `social`, `facebook`, `eid-2026`). */
  dimensionValue: string;
  /**
   * Back-compat alias: when `groupBy = 'channel'` this equals `dimensionValue`
   * so existing callers that read `row.channel` keep working unchanged.
   */
  channel: string;
  sessions: number;
  users: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

/**
 * The SQL expression a `groupBy` maps to. `source` and `campaign` fall back to
 * `channel` when the UTM column is null so a row is never keyed on an empty
 * string — an untagged visit still lands in a meaningful bucket.
 */
const GROUP_EXPR: Record<TrafficSourceGroupBy, string> = {
  channel: `s."channel"`,
  source: `COALESCE(NULLIF(s."utmSource", ''), s."channel")`,
  campaign: `COALESCE(NULLIF(s."utmCampaign", ''), s."channel")`,
};

@Injectable()
export class GetTrafficSourcesService {
  constructor(
    @InjectRepository(StorefrontSessionEntity)
    private readonly sessionRepository: Repository<StorefrontSessionEntity>,
  ) {}

  /**
   * Joins storefront_sessions to orders by the exact sessionId that produced
   * each order (threaded through checkout — see CreateOrderService), scoped by
   * tenantId on both sides. This gives exact per-dimension conversion rate rather
   * than an approximate date+channel bucket match.
   *
   * `groupBy` selects the breakdown: `channel` (default, unchanged), `source`
   * (by `utmSource`), or `campaign` (by `utmCampaign`).
   *
   * `users` is reported equal to `sessions` for now — this system has no
   * persistent cross-session visitor cookie, only a per-session id, so "users"
   * is really "anonymous visits" until a longer-lived visitor identity is added.
   */
  async execute(
    tenantId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: TrafficSourceGroupBy = 'channel',
  ): Promise<TrafficSourceRow[]> {
    const groupExpr = GROUP_EXPR[groupBy] ?? GROUP_EXPR.channel;

    const raw = await this.sessionRepository.manager.query(
      `
      SELECT
        ${groupExpr} AS "dimensionValue",
        COUNT(DISTINCT s."sessionId")::int AS "sessions",
        COUNT(DISTINCT o."id")::int AS "orders",
        COALESCE(SUM(o."grandTotal"), 0)::numeric AS "revenue"
      FROM "storefront_sessions" s
      LEFT JOIN "orders" o
        ON o."sessionId" = s."sessionId"
       AND o."tenantId" = s."tenantId"
       AND o."orderStatus" NOT IN ('CANCELLED', 'RETURNED')
      WHERE s."tenantId" = $1
        AND s."firstSeenAt" >= $2 AND s."firstSeenAt" <= $3
      GROUP BY ${groupExpr}
      ORDER BY "revenue" DESC
      `,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    return raw.map((r: any) => {
      const sessions = Number(r.sessions || 0);
      const orders = Number(r.orders || 0);
      const dimensionValue = r.dimensionValue ?? 'direct';
      return {
        dimension: groupBy,
        dimensionValue,
        channel: dimensionValue,
        sessions,
        users: sessions,
        orders,
        revenue: Number(r.revenue || 0),
        conversionRate: sessions > 0 ? Math.round((orders / sessions) * 1000) / 10 : 0,
      };
    });
  }
}
