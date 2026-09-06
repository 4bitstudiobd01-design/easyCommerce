import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

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

export interface AnalyticsOverview {
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

export interface NetProfitMetrics {
  grossRevenue: number;
  totalProductCost: number;
  totalDeliveryFees: number;
  netProfit: number;
  profitMarginPercentage: number;
  totalCompletedOrdersCount: number;
  itemsMissingCostPriceCount: number;
  productsMissingCostPriceCount: number;
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

export interface TrafficSourceRow {
  channel: string;
  sessions: number;
  users: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

export interface AnalyticsKpiSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  conversionRate: number | null;
  totalRefunded: number;
  previousTotals: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

export type InsightSeverity = 'positive' | 'negative' | 'neutral';

export interface AnalyticsInsight {
  type: string;
  title: string;
  subtitle: string;
  severity: InsightSeverity;
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
  compare?: 'previous' | 'previousYear';
}

/** Strips undefined/empty keys so RTK Query cache keys stay stable across renders. */
const cleanParams = (params?: object | null | void): Record<string, unknown> => {
  if (!params || typeof params !== 'object') return {};
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== ''),
  );
};

const unwrap = <T>(response: { data: T } | T): T =>
  response && typeof response === 'object' && 'data' in (response as any) ? (response as any).data : (response as T);

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1'),
  tagTypes: ['Analytics'],
  endpoints: (builder) => ({
    getAnalyticsOverview: builder.query<AnalyticsOverview, DateRangeParams | void>({
      query: (params) => ({ url: '/analytics/overview', params: cleanParams(params) }),
      providesTags: ['Analytics'],
      transformResponse: unwrap<AnalyticsOverview>,
    }),
    getNetProfit: builder.query<NetProfitMetrics, void>({
      query: () => '/analytics/net-profit',
      providesTags: ['Analytics'],
      transformResponse: unwrap<NetProfitMetrics>,
    }),
    getNewVsReturningTrend: builder.query<NewVsReturningTrendPoint[], { days?: number } | void>({
      query: (params) => ({
        url: '/analytics/customers/new-vs-returning-trend',
        params: cleanParams(params),
      }),
      providesTags: ['Analytics'],
      transformResponse: unwrap<NewVsReturningTrendPoint[]>,
    }),
    getNewVsReturningSummary: builder.query<NewVsReturningSummary, DateRangeParams | void>({
      query: (params) => ({
        url: '/analytics/customers/new-vs-returning-summary',
        params: cleanParams(params),
      }),
      providesTags: ['Analytics'],
      transformResponse: unwrap<NewVsReturningSummary>,
    }),
    getTrafficSources: builder.query<TrafficSourceRow[], DateRangeParams | void>({
      query: (params) => ({ url: '/analytics/traffic-sources', params: cleanParams(params) }),
      providesTags: ['Analytics'],
      transformResponse: unwrap<TrafficSourceRow[]>,
    }),
    getAnalyticsKpiSummary: builder.query<AnalyticsKpiSummary, DateRangeParams | void>({
      query: (params) => ({ url: '/analytics/kpi-summary', params: cleanParams(params) }),
      providesTags: ['Analytics'],
      transformResponse: unwrap<AnalyticsKpiSummary>,
    }),
    getAnalyticsInsights: builder.query<AnalyticsInsight[], DateRangeParams | void>({
      query: (params) => ({ url: '/analytics/insights', params: cleanParams(params) }),
      providesTags: ['Analytics'],
      transformResponse: unwrap<AnalyticsInsight[]>,
    }),
  }),
});

export const {
  useGetAnalyticsOverviewQuery,
  useGetNetProfitQuery,
  useGetNewVsReturningTrendQuery,
  useGetNewVsReturningSummaryQuery,
  useGetTrafficSourcesQuery,
  useGetAnalyticsKpiSummaryQuery,
  useGetAnalyticsInsightsQuery,
} = analyticsApi;
