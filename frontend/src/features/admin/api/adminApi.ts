import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
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

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/admin',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdminStats', 'AdminStores', 'AdminOrders', 'PlatformConfig'],
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
      invalidatesTags: ['AdminStats', 'AdminStores'],
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
  }),
});

export const {
  useGetPlatformStatsQuery,
  useGetAllStoresQuery,
  useGetAllSystemOrdersQuery,
  useToggleStoreStatusMutation,
  useGetPlatformConfigQuery,
  useUpdatePlatformConfigMutation,
} = adminApi;
