import { Injectable } from '@nestjs/common';
import { GetMerchantAnalyticsService } from './get-merchant-analytics.service';
import { GetCustomerAnalyticsService } from '../../customer/services/get-customer-analytics.service';

export type InsightSeverity = 'positive' | 'negative' | 'neutral';

export interface AnalyticsInsight {
  type: string;
  title: string;
  subtitle: string;
  severity: InsightSeverity;
}

/**
 * Composes signals from other services' already-computed data (DI, same
 * aggregator pattern as GetAnalyticsKpiSummaryService) into short insight
 * cards. Every insight here is only emitted when its underlying real signal
 * is meaningful — no fabricated claims, no fixed "always show 4" slot count.
 */
@Injectable()
export class GetAnalyticsInsightsService {
  constructor(
    private readonly getMerchantAnalyticsService: GetMerchantAnalyticsService,
    private readonly getCustomerAnalyticsService: GetCustomerAnalyticsService,
  ) {}

  async execute(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<AnalyticsInsight[]> {
    const customerQuery =
      dateFrom || dateTo
        ? { dateFrom: dateFrom?.toISOString(), dateTo: dateTo?.toISOString() }
        : {};
    const [overview, newVsReturning] = await Promise.all([
      this.getMerchantAnalyticsService.execute(tenantId, dateFrom, dateTo),
      this.getCustomerAnalyticsService.getNewVsReturningSummary(tenantId, customerQuery),
    ]);

    const insights: AnalyticsInsight[] = [];

    // Revenue vs previous period — only if the previous period had any orders
    // to compare against (a brand-new store's first week has no baseline).
    if (overview.previousTotals.totalOrders > 0) {
      const change =
        ((overview.totalSales - overview.previousTotals.totalSales) / overview.previousTotals.totalSales) * 100;
      if (Number.isFinite(change) && Math.abs(change) >= 1) {
        insights.push({
          type: 'revenue_trend',
          title: `Revenue is ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% vs the previous period`,
          subtitle: `৳${overview.totalSales.toLocaleString('en-US')} this period vs ৳${overview.previousTotals.totalSales.toLocaleString('en-US')} previously`,
          severity: change >= 0 ? 'positive' : 'negative',
        });
      }
    }

    // Top channel — only if a non-direct channel carries real, distinguishable volume.
    const topChannel = overview.channelBreakdown[0];
    if (topChannel && topChannel.channel !== 'direct' && topChannel.orderCount >= 2) {
      const totalOrders = overview.channelBreakdown.reduce((sum, c) => sum + c.orderCount, 0);
      const share = totalOrders > 0 ? Math.round((topChannel.orderCount / totalOrders) * 100) : 0;
      insights.push({
        type: 'top_channel',
        title: `${this.formatChannelLabel(topChannel.channel)} is your top acquisition channel`,
        subtitle: `${share}% of orders in this period came through ${this.formatChannelLabel(topChannel.channel)}`,
        severity: 'neutral',
      });
    }

    // Top product — only if there is at least one real sale.
    const topProduct = overview.topSellingProducts[0];
    if (topProduct) {
      insights.push({
        type: 'top_product',
        title: `${topProduct.title} is your top selling product`,
        subtitle: `${topProduct.totalQuantity} units sold, ৳${topProduct.totalRevenue.toLocaleString('en-US')} revenue this period`,
        severity: 'positive',
      });
    }

    // Returning customer share — only once there's enough volume for the
    // percentage to mean anything.
    const totalClassified = newVsReturning.newCustomers + newVsReturning.returningCustomers;
    if (totalClassified >= 5) {
      insights.push({
        type: 'returning_share',
        title: `${newVsReturning.returningPercentage.toFixed(1)}% of customers this period are returning`,
        subtitle: `${newVsReturning.returningCustomers} returning vs ${newVsReturning.newCustomers} new customers`,
        severity: newVsReturning.returningPercentage >= 30 ? 'positive' : 'neutral',
      });
    }

    return insights.slice(0, 4);
  }

  private formatChannelLabel(channel: string): string {
    return channel
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
