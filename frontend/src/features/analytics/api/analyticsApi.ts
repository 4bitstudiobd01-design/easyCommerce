import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

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

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/analytics',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Analytics'],
  endpoints: (builder) => ({
    getAnalyticsOverview: builder.query<MerchantAnalyticsOverview, void>({
      query: () => '/overview',
      providesTags: ['Analytics'],
      transformResponse: (response: { data: MerchantAnalyticsOverview }) => response.data,
    }),
  }),
});

export const { useGetAnalyticsOverviewQuery } = analyticsApi;
