import { Injectable } from '@nestjs/common';
import { GetMerchantAnalyticsService } from './get-merchant-analytics.service';
import { GetCustomerAnalyticsService } from '../../customer/services/get-customer-analytics.service';
import { GetTrafficSourcesService } from '../../tracking/services/get-traffic-sources.service';
import { GetRefundsSummaryService } from '../../payment/services/get-refunds-summary.service';

export interface AnalyticsKpiSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  /** null when there are no recorded sessions yet — distinct from a real 0%. */
  conversionRate: number | null;
  totalRefunded: number;
  previousTotals: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

/**
 * Composes signals already owned by other modules' services via DI — this is a
 * controller-style aggregator, not a data owner. No cross-module DB joins:
 * each figure comes from its own module's service.
 */
@Injectable()
export class GetAnalyticsKpiSummaryService {
  constructor(
    private readonly getMerchantAnalyticsService: GetMerchantAnalyticsService,
    private readonly getCustomerAnalyticsService: GetCustomerAnalyticsService,
    private readonly getTrafficSourcesService: GetTrafficSourcesService,
    private readonly getRefundsSummaryService: GetRefundsSummaryService,
  ) {}

  async execute(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<AnalyticsKpiSummary> {
    const to = dateTo ?? new Date();
    const from = dateFrom ?? new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [overview, customerOverview, trafficSources, refundsSummary] = await Promise.all([
      this.getMerchantAnalyticsService.execute(tenantId, from, to),
      this.getCustomerAnalyticsService.getOverview(tenantId, {
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
      }),
      this.getTrafficSourcesService.execute(tenantId, from, to),
      this.getRefundsSummaryService.execute(tenantId, from, to),
    ]);

    const totalSessions = trafficSources.reduce((sum, row) => sum + row.sessions, 0);
    const totalConvertedOrders = trafficSources.reduce((sum, row) => sum + row.orders, 0);

    return {
      totalRevenue: overview.totalSales,
      totalOrders: overview.totalOrders,
      averageOrderValue: overview.averageOrderValue,
      totalCustomers: customerOverview.totalCustomers,
      conversionRate: totalSessions > 0 ? Math.round((totalConvertedOrders / totalSessions) * 1000) / 10 : null,
      totalRefunded: refundsSummary.totalRefunded,
      previousTotals: {
        totalRevenue: overview.previousTotals.totalSales,
        totalOrders: overview.previousTotals.totalOrders,
        averageOrderValue: overview.previousTotals.averageOrderValue,
      },
    };
  }
}
