import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum } from '../entities/order.entity';

export interface OrderKpiMetrics {
  totalOrders: number;
  pendingConfirmation: number;
  readyToShip: number;
  delivered: number;
  /** Count per order status, keyed by OrderStatusEnum value — drives the status tab badges. */
  statusCounts: Record<string, number>;
  /** Percentage change vs the preceding window of equal length. Null when there is no baseline. */
  trends: {
    totalOrders: number | null;
    delivered: number | null;
  };
}

const TREND_WINDOW_DAYS = 7;

@Injectable()
export class OrderKpiService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async execute(tenantId: string): Promise<OrderKpiMetrics> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const previousWindowStart = new Date(
      now.getTime() - 2 * TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const [statusRows, windowRows] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('order')
        .select('order.orderStatus', 'status')
        .addSelect('COUNT(order.id)', 'count')
        .where('order.tenantId = :tenantId', { tenantId })
        .groupBy('order.orderStatus')
        .getRawMany<{ status: string; count: string }>(),

      // Current vs preceding window, in one pass, so the trend costs a single extra query.
      this.orderRepository
        .createQueryBuilder('order')
        .select(
          'CASE WHEN order.createdAt >= :windowStart THEN 1 ELSE 0 END',
          'isCurrentWindow',
        )
        .addSelect('order.orderStatus', 'status')
        .addSelect('COUNT(order.id)', 'count')
        .where('order.tenantId = :tenantId', { tenantId })
        .andWhere('order.createdAt >= :previousWindowStart', { previousWindowStart })
        .setParameter('windowStart', windowStart)
        .groupBy('order.orderStatus')
        .addGroupBy('CASE WHEN order.createdAt >= :windowStart THEN 1 ELSE 0 END')
        .getRawMany<{ isCurrentWindow: string; status: string; count: string }>(),
    ]);

    const metrics: OrderKpiMetrics = {
      totalOrders: 0,
      pendingConfirmation: 0,
      readyToShip: 0,
      delivered: 0,
      statusCounts: {},
      trends: { totalOrders: null, delivered: null },
    };

    for (const status of Object.values(OrderStatusEnum)) {
      metrics.statusCounts[status] = 0;
    }

    for (const row of statusRows) {
      const count = Number(row.count) || 0;
      metrics.totalOrders += count;
      metrics.statusCounts[row.status] = count;

      if (row.status === OrderStatusEnum.PENDING) {
        metrics.pendingConfirmation += count;
      } else if (row.status === OrderStatusEnum.READY_TO_SHIP) {
        metrics.readyToShip += count;
      } else if (row.status === OrderStatusEnum.DELIVERED) {
        metrics.delivered += count;
      }
    }

    let currentTotal = 0;
    let previousTotal = 0;
    let currentDelivered = 0;
    let previousDelivered = 0;

    for (const row of windowRows) {
      const count = Number(row.count) || 0;
      const isCurrent = Number(row.isCurrentWindow) === 1;

      if (isCurrent) {
        currentTotal += count;
        if (row.status === OrderStatusEnum.DELIVERED) currentDelivered += count;
      } else {
        previousTotal += count;
        if (row.status === OrderStatusEnum.DELIVERED) previousDelivered += count;
      }
    }

    metrics.trends.totalOrders = this.percentageChange(previousTotal, currentTotal);
    metrics.trends.delivered = this.percentageChange(previousDelivered, currentDelivered);

    return metrics;
  }

  /** Null rather than a fabricated 100% when there is no prior activity to compare against. */
  private percentageChange(previous: number, current: number): number | null {
    if (previous <= 0) return null;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }
}
