import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { OrderEntity, PaymentMethodEnum } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';

export interface DailyRevenuePoint {
  date: string;
  dayName: string;
  revenue: number;
  ordersCount: number;
}

export interface PaymentMethodStats {
  codCount: number;
  sslCommerzCount: number;
  codPercent: number;
  sslCommerzPercent: number;
}

export interface TopProductStat {
  productId: string;
  title: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface ChannelBreakdownStat {
  channel: string;
  orderCount: number;
  revenue: number;
}

export interface PeriodTotals {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface MerchantAnalyticsOverview {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyRevenueTrend: DailyRevenuePoint[];
  previousDailyRevenueTrend: DailyRevenuePoint[];
  previousTotals: PeriodTotals;
  paymentMethodStats: PaymentMethodStats;
  topSellingProducts: TopProductStat[];
  channelBreakdown: ChannelBreakdownStat[];
}

@Injectable()
export class GetMerchantAnalyticsService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
  ) {}

  /**
   * `dateFrom`/`dateTo` default to the trailing 7 days (this service's original
   * behaviour). The "previous" period is the immediately preceding window of
   * equal length, used to compute period-over-period comparison lines/badges.
   */
  async execute(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<MerchantAnalyticsOverview> {
    const rangeTo = dateTo ?? new Date();
    const rangeFrom = dateFrom ?? new Date(rangeTo.getTime() - 6 * 24 * 60 * 60 * 1000);
    rangeFrom.setHours(0, 0, 0, 0);

    const spanMs = rangeTo.getTime() - rangeFrom.getTime();
    const previousTo = new Date(rangeFrom.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - spanMs);

    const [orders, previousOrders] = await Promise.all([
      this.orderRepository.find({
        where: { tenantId, createdAt: Between(rangeFrom, rangeTo) },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      }),
      this.orderRepository.find({
        where: { tenantId, createdAt: Between(previousFrom, previousTo) },
      }),
    ]);

    const totalOrders = orders.length;
    const totalSales = orders.reduce((acc, order) => acc + Number(order.grandTotal), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    const previousTotalOrders = previousOrders.length;
    const previousTotalSales = previousOrders.reduce((acc, order) => acc + Number(order.grandTotal), 0);
    const previousTotals: PeriodTotals = {
      totalSales: previousTotalSales,
      totalOrders: previousTotalOrders,
      averageOrderValue: previousTotalOrders > 0 ? Math.round(previousTotalSales / previousTotalOrders) : 0,
    };

    // Payment Method Distribution
    const codCount = orders.filter((o) => o.paymentMethod === PaymentMethodEnum.COD).length;
    const sslCommerzCount = orders.filter(
      (o) => o.paymentMethod === PaymentMethodEnum.SSLCOMMERZ || o.paymentMethod === PaymentMethodEnum.BKASH,
    ).length;

    const codPercent = totalOrders > 0 ? Math.round((codCount / totalOrders) * 100) : 0;
    const sslCommerzPercent = totalOrders > 0 ? Math.round((sslCommerzCount / totalOrders) * 100) : 0;

    const dailyRevenueTrend = this.buildDailyTrend(orders, rangeFrom, rangeTo);
    const previousDailyRevenueTrend = this.buildDailyTrend(previousOrders, previousFrom, previousTo);

    // Top Selling Products Aggregation
    const productMap = new Map<string, { title: string; qty: number; revenue: number }>();

    for (const order of orders) {
      if (order.items) {
        for (const item of order.items) {
          const existing = productMap.get(item.productId) || {
            title: item.productTitle,
            qty: 0,
            revenue: 0,
          };
          existing.qty += item.quantity;
          existing.revenue += Number(item.totalPrice);
          productMap.set(item.productId, existing);
        }
      }
    }

    const topSellingProducts: TopProductStat[] = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        title: data.title,
        totalQuantity: data.qty,
        totalRevenue: data.revenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Sales by Channel Aggregation
    const channelMap = new Map<string, { orderCount: number; revenue: number }>();
    for (const order of orders) {
      const channel = order.channel || 'direct';
      const existing = channelMap.get(channel) || { orderCount: 0, revenue: 0 };
      existing.orderCount += 1;
      existing.revenue += Number(order.grandTotal);
      channelMap.set(channel, existing);
    }

    const channelBreakdown: ChannelBreakdownStat[] = Array.from(channelMap.entries())
      .map(([channel, data]) => ({ channel, orderCount: data.orderCount, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      dailyRevenueTrend,
      previousDailyRevenueTrend,
      previousTotals,
      paymentMethodStats: {
        codCount,
        sslCommerzCount,
        codPercent,
        sslCommerzPercent,
      },
      topSellingProducts,
      channelBreakdown,
    };
  }

  private buildDailyTrend(orders: OrderEntity[], from: Date, to: Date): DailyRevenuePoint[] {
    const trend: DailyRevenuePoint[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const endStr = to.toISOString().split('T')[0];

    while (cursor.toISOString().split('T')[0] <= endStr) {
      const dateStr = cursor.toISOString().split('T')[0];
      const dayName = cursor.toLocaleDateString('en-US', { weekday: 'short' });

      const dayOrders = orders.filter((o) => new Date(o.createdAt).toISOString().split('T')[0] === dateStr);
      const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);

      trend.push({
        date: dateStr,
        dayName,
        revenue: dayRevenue,
        ordersCount: dayOrders.length,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return trend;
  }
}
