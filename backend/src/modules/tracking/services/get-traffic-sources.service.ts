import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorefrontSessionEntity } from '../entities/storefront-session.entity';

export interface TrafficSourceRow {
  channel: string;
  sessions: number;
  users: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

@Injectable()
export class GetTrafficSourcesService {
  constructor(
    @InjectRepository(StorefrontSessionEntity)
    private readonly sessionRepository: Repository<StorefrontSessionEntity>,
  ) {}

  /**
   * Joins storefront_sessions to orders by the exact sessionId that produced
   * each order (threaded through checkout — see CreateOrderService), scoped by
   * tenantId on both sides. This gives exact per-channel conversion rate rather
   * than an approximate date+channel bucket match.
   *
   * `users` is reported equal to `sessions` for now — this system has no
   * persistent cross-session visitor cookie, only a per-session id, so "users"
   * is really "anonymous visits" until a longer-lived visitor identity is added.
   */
  async execute(tenantId: string, dateFrom: Date, dateTo: Date): Promise<TrafficSourceRow[]> {
    const raw = await this.sessionRepository.manager.query(
      `
      SELECT
        s."channel" AS "channel",
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
      GROUP BY s."channel"
      ORDER BY "revenue" DESC
      `,
      [tenantId, dateFrom.toISOString(), dateTo.toISOString()],
    );

    return raw.map((r: any) => {
      const sessions = Number(r.sessions || 0);
      const orders = Number(r.orders || 0);
      return {
        channel: r.channel,
        sessions,
        users: sessions,
        orders,
        revenue: Number(r.revenue || 0),
        conversionRate: sessions > 0 ? Math.round((orders / sessions) * 1000) / 10 : 0,
      };
    });
  }
}
