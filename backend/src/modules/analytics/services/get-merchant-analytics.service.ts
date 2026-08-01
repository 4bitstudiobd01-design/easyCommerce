import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

export interface MerchantAnalyticsOverview {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyRevenueTrend: DailyRevenuePoint[];
  paymentMethodStats: PaymentMethodStats;
  topSellingProducts: TopProductStat[];
}

@Injectable()
export class GetMerchantAnalyticsService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
  ) {}

  async execute(tenantId: string): Promise<MerchantAnalyticsOverview> {
    const orders = await this.orderRepository.find({
      where: { tenantId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    const totalOrders = orders.length;
    const totalSales = orders.reduce((acc, order) => acc + Number(order.grandTotal), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    // Payment Method Distribution
    const codCount = orders.filter((o) => o.paymentMethod === PaymentMethodEnum.COD).length;
    const sslCommerzCount = orders.filter(
      (o) => o.paymentMethod === PaymentMethodEnum.SSLCOMMERZ || o.paymentMethod === PaymentMethodEnum.BKASH,
    ).length;

    const codPercent = totalOrders > 0 ? Math.round((codCount / totalOrders) * 100) : 0;
    const sslCommerzPercent = totalOrders > 0 ? Math.round((sslCommerzCount / totalOrders) * 100) : 0;

    // Daily Revenue Trend (Last 7 Days)
    const dailyRevenueTrend: DailyRevenuePoint[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayOrders = orders.filter((o) => {
        const orderDateStr = new Date(o.createdAt).toISOString().split('T')[0];
        return orderDateStr === dateStr;
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);

      dailyRevenueTrend.push({
        date: dateStr,
        dayName,
        revenue: dayRevenue,
        ordersCount: dayOrders.length,
      });
    }

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
      .slice(0, 3);

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      dailyRevenueTrend,
      paymentMethodStats: {
        codCount,
        sslCommerzCount,
        codPercent,
        sslCommerzPercent,
      },
      topSellingProducts,
    };
  }
}
