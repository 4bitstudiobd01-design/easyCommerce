import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export interface AnalyticsOverview {
  totalSales?: number;
  totalRevenue?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  dailyRevenueTrend?: { date: string; revenue: number; orders: number; ordersCount?: number; dayName?: string }[];
  revenueByDay?: { date: string; revenue: number }[];
  paymentMethodStats?: { codCount: number; sslCommerzCount: number; codPercent: number; sslCommerzPercent: number };
  paymentMethodBreakdown?: { method: string; count: number; total: number }[];
  topProducts?: { productId: string; productTitle: string; title?: string; totalSold: number; totalQuantity?: number; count?: number; totalRevenue: number }[];
  topSellingProducts?: { productId: string; productTitle: string; title?: string; totalSold: number; totalQuantity?: number; count?: number; totalRevenue: number }[];
}

export interface NetProfitMetrics {
  grossRevenue: number;
  totalProductCost: number;
  totalDeliveryFees: number;
  netProfit: number;
  profitMarginPercentage: number;
  totalCompletedOrdersCount: number;
}

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      const activeStoreId = localStorage.getItem('easycommerce_active_store_id');
      if (activeStoreId) {
        headers.set('x-store-id', activeStoreId);
      }
      return headers;
    },
  }),
  tagTypes: ['Analytics'],
  endpoints: (builder) => ({
    getAnalyticsOverview: builder.query<AnalyticsOverview, void>({
      query: () => '/analytics/overview',
      providesTags: ['Analytics'],
      transformResponse: (response: { data: AnalyticsOverview } | AnalyticsOverview) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    getNetProfit: builder.query<NetProfitMetrics, void>({
      query: () => '/analytics/net-profit',
      providesTags: ['Analytics'],
      transformResponse: (response: { data: NetProfitMetrics } | NetProfitMetrics) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
  }),
});

export const { useGetAnalyticsOverviewQuery, useGetNetProfitQuery } = analyticsApi;
