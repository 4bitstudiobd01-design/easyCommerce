import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export interface PlatformStatsOverview {
  totalPlatformRevenue: number;
  totalMerchantsCount: number;
  totalStoresCount: number;
  activeStoresCount: number;
  suspendedStoresCount: number;
  totalSystemOrdersCount: number;
}

export interface AdminStoreDetail {
  id: string;
  name: string;
  slug: string;
  category?: string;
  phone?: string;
  address?: string;
  domain?: string;
  currency: string;
  isActive: boolean;
  tenantId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ordersCount: number;
  totalRevenue: number;
  createdAt: string;
}

export interface AdminSystemOrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  storeSlug: string;
  storeName: string;
  createdAt: string;
}

export interface PlatformConfig {
  id: string;
  configKey: string;
  heroContent: {
    title?: string;
    subtitle?: string;
    ctaPrimaryText?: string;
    ctaPrimaryLink?: string;
    ctaSecondaryText?: string;
    ctaSecondaryLink?: string;
  };
  pricingPlans: any[];
  testimonials: any[];
  faqs: any[];
}

export interface DashboardSummaryData {
  platformHealthSnapshot: {
    overallStatus: 'operational' | 'degraded' | 'outage';
    label: string;
  };
  kpis: {
    totalRevenueBdt: number;
    totalRevenueGrowthPercent: number;
    monthlyRevenueBdt: number;
    monthlyRevenueGrowthPercent: number;
    quarterlyGrowthPercent: number;
  };
  merchantSummary: {
    totalMerchants: number;
    activeMerchants: number;
    newMerchantsThisMonth: number;
    suspendedMerchants: number;
  };
  storeSummary: {
    totalStores: number;
    activeStores: number;
    trialStores: number;
    suspendedStores: number;
  };
  orderSummary: {
    todayOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  };
}

export interface DashboardAnalyticsData {
  revenueTrend: Array<{ date: string; revenueBdt: number }>;
  merchantGrowth: Array<{ date: string; totalMerchants: number }>;
  ordersTrend: Array<{ dayName: string; ordersCount: number }>;
  subscriptionBreakdown: Array<{ name: string; value: number; color: string }>;
  paymentMethodsShare: Array<{ name: string; value: number; color: string }>;
}

export interface DashboardOperationsData {
  recentActivities: Array<{
    id: string;
    title: string;
    subtitle: string;
    timestamp: string;
    eventType: string;
    severity: 'info' | 'success' | 'warning' | 'error';
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    severity: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
  }>;
  topMerchants: Array<{
    id: string;
    name: string;
    slug: string;
    revenueBdt: number;
    ordersCount: number;
    growthPercent: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    revenueBdt: number;
    ordersCount: number;
    conversionRatePercent: number;
  }>;
}

export interface DashboardInfrastructureData {
  overallStatus: 'operational' | 'degraded' | 'outage';
  overallLabel: string;
  microservices: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    metric: string;
  }>;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/admin'),
  tagTypes: ['AdminStats', 'AdminStores', 'AdminOrders', 'PlatformConfig', 'AdminSummary', 'AdminAnalytics', 'AdminOperations', 'AdminInfra', 'AdminContactMessages'],
  endpoints: (builder) => ({
    getPlatformStats: builder.query<PlatformStatsOverview, void>({
      query: () => '/stats',
      providesTags: ['AdminStats'],
      transformResponse: (response: { data: PlatformStatsOverview }) => response.data,
    }),
    getAllStores: builder.query<AdminStoreDetail[], void>({
      query: () => '/stores',
      providesTags: ['AdminStores'],
      transformResponse: (response: { data: AdminStoreDetail[] }) => response.data,
    }),
    getAllSystemOrders: builder.query<AdminSystemOrderDetail[], void>({
      query: () => '/orders',
      providesTags: ['AdminOrders'],
      transformResponse: (response: { data: AdminSystemOrderDetail[] }) => response.data,
    }),
    toggleStoreStatus: builder.mutation<AdminStoreDetail, string>({
      query: (storeId) => ({
        url: `/stores/${storeId}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminStats', 'AdminStores', 'AdminSummary'],
      transformResponse: (response: { data: AdminStoreDetail }) => response.data,
    }),
    getPlatformConfig: builder.query<PlatformConfig, void>({
      query: () => '/platform-config',
      providesTags: ['PlatformConfig'],
    }),
    updatePlatformConfig: builder.mutation<PlatformConfig, Partial<PlatformConfig>>({
      query: (body) => ({
        url: '/platform-config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PlatformConfig'],
    }),
    getDashboardSummary: builder.query<DashboardSummaryData, { dateRangePreset?: string; currency?: string } | void>({
      query: (params) => ({
        url: '/dashboard/summary',
        params: params || {},
      }),
      providesTags: ['AdminSummary'],
      transformResponse: (response: { data: DashboardSummaryData }) => response.data,
    }),
    getDashboardAnalytics: builder.query<DashboardAnalyticsData, { timeframe?: string } | void>({
      query: (params) => ({
        url: '/dashboard/analytics',
        params: params || {},
      }),
      providesTags: ['AdminAnalytics'],
      transformResponse: (response: { data: DashboardAnalyticsData }) => response.data,
    }),
    getDashboardOperations: builder.query<DashboardOperationsData, { limit?: number } | void>({
      query: (params) => ({
        url: '/dashboard/operations',
        params: params || {},
      }),
      providesTags: ['AdminOperations'],
      transformResponse: (response: { data: DashboardOperationsData }) => response.data,
    }),
    getDashboardInfrastructure: builder.query<DashboardInfrastructureData, void>({
      query: () => '/dashboard/infrastructure',
      providesTags: ['AdminInfra'],
      transformResponse: (response: { data: DashboardInfrastructureData }) => response.data,
    }),
    submitContactMessage: builder.mutation<ContactMessage, CreateContactMessageRequest>({
      query: (body) => ({
        url: '/contact-messages',
        method: 'POST',
        body,
      }),
    }),
    getContactMessages: builder.query<ContactMessage[], void>({
      query: () => '/contact-messages',
      providesTags: ['AdminContactMessages'],
    }),
  }),
});

export const {
  useGetPlatformStatsQuery,
  useGetAllStoresQuery,
  useGetAllSystemOrdersQuery,
  useToggleStoreStatusMutation,
  useGetPlatformConfigQuery,
  useUpdatePlatformConfigMutation,
  useGetDashboardSummaryQuery,
  useGetDashboardAnalyticsQuery,
  useGetDashboardOperationsQuery,
  useGetDashboardInfrastructureQuery,
  useSubmitContactMessageMutation,
  useGetContactMessagesQuery,
} = adminApi;
