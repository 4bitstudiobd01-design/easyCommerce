import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export interface Store {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  category?: string;
  phone?: string;
  address?: string;
  logo?: string;
  favicon?: string;
  metaTitle?: string;
  metaDescription?: string;
  activeThemeId?: string;
  unlockedThemeIds?: string[];
  primaryColor?: string;
  fontFamily?: string;
  heroBanners?: any[];
  facebookPixelId?: string;
  facebookCapiToken?: string;
  facebookTestEventCode?: string;
  tiktokPixelId?: string;
  googleTagManagerId?: string;
  currency: string;
  steadfastApiKey?: string;
  steadfastSecretKey?: string;
  pathaoClientId?: string;
  pathaoClientSecret?: string;
  
  // Policies
  privacyPolicy?: string;
  termsOfService?: string;
  refundPolicy?: string;
  
  // Blocklist
  blockedIps?: string[];
  blockedEmails?: string[];
  
  // Limits
  maxCodOrdersPerIp?: number;
  maxOrdersPerDay?: number;
  
  ownerId: string;
  tenantId: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Localization
  language?: string;
  timezone?: string;
  dateFormat?: string;
  weightUnit?: string;

  // Store preferences
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  catalogModeEnabled?: boolean;
  showOutOfStockProducts?: boolean;

  // Order settings
  orderNumberPrefix?: string;
  autoConfirmOrders?: boolean;
  invoiceFooterNote?: string;

  // Checkout settings
  guestCheckoutEnabled?: boolean;
  requireCustomerEmail?: boolean;
  showCouponFieldAtCheckout?: boolean;
  showOrderNoteFieldAtCheckout?: boolean;
  minimumOrderAmount?: number;

  // Customer settings
  allowCustomerRegistration?: boolean;
  requireEmailVerification?: boolean;
  allowCustomerReviews?: boolean;
  autoApproveReviews?: boolean;

  // Navigation & homepage
  navigationLinks?: NavigationLink[];
  showHeroSection?: boolean;
  showFeaturedProducts?: boolean;
  showCategoriesSection?: boolean;
  featuredProductsCount?: number;
}

export interface NavigationLink {
  id: string;
  label: string;
  url: string;
  location: 'HEADER' | 'FOOTER';
  sortOrder: number;
}

export interface DeliveryZone {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  areas: string[];
  deliveryCharge: number;
  estimatedDeliveryTime?: string;
  isActive: boolean;
  createdAt: string;
}

export type WebhookEvent =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_UPDATED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_COMPLETED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'CUSTOMER_CREATED';

export interface StoreWebhook {
  id: string;
  targetUrl: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  failureCount: number;
  lastError?: string;
  createdAt: string;
}

export interface StoreApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreatedApiKey extends StoreApiKey {
  /** Plaintext key, shown exactly once at creation. */
  key: string;
}

export interface StoreThemeItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  isFree: boolean;
  previewImage: string;
  features: string[];
  primaryColorDefault: string;
  isUnlocked: boolean;
  isActive: boolean;
}

export interface ThemeCatalogResponse {
  activeThemeId: string;
  unlockedThemeIds: string[];
  themes: StoreThemeItem[];
}

export interface CreateStoreRequest {
  name: string;
  slug: string;
  category?: string;
  phone?: string;
  address?: string;
  logo?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  phone?: string;
  address?: string;
  domain?: string;
  currency?: string;
  logo?: string;
  favicon?: string;
  metaTitle?: string;
  metaDescription?: string;
  primaryColor?: string;
  fontFamily?: string;
  heroBanners?: any[];
  facebookPixelId?: string;
  facebookCapiToken?: string;
  facebookTestEventCode?: string;
  tiktokPixelId?: string;
  googleTagManagerId?: string;
  steadfastApiKey?: string;
  steadfastSecretKey?: string;
  pathaoClientId?: string;
  pathaoClientSecret?: string;
  
  // Policies
  privacyPolicy?: string;
  termsOfService?: string;
  refundPolicy?: string;
  
  // Blocklist
  blockedIps?: string[];
  blockedEmails?: string[];
  
  // Limits
  maxCodOrdersPerIp?: number;
  maxOrdersPerDay?: number;

  // Localization
  language?: string;
  timezone?: string;
  dateFormat?: string;
  weightUnit?: string;

  // Store preferences
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  catalogModeEnabled?: boolean;
  showOutOfStockProducts?: boolean;

  // Order settings
  orderNumberPrefix?: string;
  autoConfirmOrders?: boolean;
  invoiceFooterNote?: string;

  // Checkout settings
  guestCheckoutEnabled?: boolean;
  requireCustomerEmail?: boolean;
  showCouponFieldAtCheckout?: boolean;
  showOrderNoteFieldAtCheckout?: boolean;
  minimumOrderAmount?: number;

  // Customer settings
  allowCustomerRegistration?: boolean;
  requireEmailVerification?: boolean;
  allowCustomerReviews?: boolean;
  autoApproveReviews?: boolean;

  // Navigation & homepage
  navigationLinks?: NavigationLink[];
  showHeroSection?: boolean;
  showFeaturedProducts?: boolean;
  showCategoriesSection?: boolean;
  featuredProductsCount?: number;
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1')
  .replace(/\/+$/, '')
  .replace(/\/stores$/, '');

export const tenantApi = createApi({
  reducerPath: 'tenantApi',
  baseQuery: createBaseQueryWithReauth(`${API_ROOT}/stores`),
  tagTypes: ['Store', 'Themes', 'DeliveryZone', 'ApiKey', 'Webhook'],
  endpoints: (builder) => ({
    getMyStores: builder.query<Store[], void>({
      query: () => '/my-stores',
      providesTags: ['Store'],
      transformResponse: (response: { data: Store[] } | Store[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    getMyStore: builder.query<Store | null, void>({
      query: () => '/me',
      providesTags: ['Store'],
      transformResponse: (response: { data: Store | null }) => response.data,
    }),
    getStoreBySlug: builder.query<Store, string>({
      query: (slug) => `/slug/${slug}`,
      providesTags: ['Store'],
      transformResponse: (response: { data: Store }) => response.data,
    }),
    createStore: builder.mutation<Store, CreateStoreRequest>({
      query: (storeData) => ({
        url: '',
        method: 'POST',
        body: storeData,
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: { data: Store }) => response.data,
    }),
    updateStore: builder.mutation<Store, UpdateStoreRequest>({
      query: (storeData) => ({
        url: '/me',
        method: 'PUT',
        body: storeData,
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: { data: Store }) => response.data,
    }),
    deleteMyStore: builder.mutation<
      { success: boolean; message: string },
      { password: string; confirmStoreName: string }
    >({
      query: (body) => ({
        url: '/me',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['Store'],
      // See testWebhook: the envelope hoists `message` and nulls `data`.
      transformResponse: (response: any) => ({
        success: response?.data?.success ?? response?.success ?? false,
        message: response?.message || 'Store closed.',
      }),
    }),

    // --- Delivery Zones ---
    getDeliveryZones: builder.query<DeliveryZone[], void>({
      query: () => '/me/delivery-zones',
      providesTags: ['DeliveryZone'],
      transformResponse: (response: { data: DeliveryZone[] } | DeliveryZone[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    createDeliveryZone: builder.mutation<
      DeliveryZone,
      { name: string; areas: string[]; deliveryCharge: number; estimatedDeliveryTime?: string; isActive?: boolean }
    >({
      query: (body) => ({ url: '/me/delivery-zones', method: 'POST', body }),
      invalidatesTags: ['DeliveryZone'],
      transformResponse: (response: { data: DeliveryZone } | DeliveryZone) =>
        (response as any).data || response,
    }),
    updateDeliveryZone: builder.mutation<
      DeliveryZone,
      { id: string; data: Partial<Omit<DeliveryZone, 'id' | 'tenantId' | 'storeId' | 'createdAt'>> }
    >({
      query: ({ id, data }) => ({ url: `/me/delivery-zones/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['DeliveryZone'],
      transformResponse: (response: { data: DeliveryZone } | DeliveryZone) =>
        (response as any).data || response,
    }),
    deleteDeliveryZone: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/me/delivery-zones/${id}`, method: 'DELETE' }),
      invalidatesTags: ['DeliveryZone'],
      transformResponse: (response: { data: any } | any) => (response as any).data || response,
    }),

    // --- API Keys ---
    getApiKeys: builder.query<StoreApiKey[], void>({
      query: () => '/me/api-keys',
      providesTags: ['ApiKey'],
      transformResponse: (response: { data: StoreApiKey[] } | StoreApiKey[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    createApiKey: builder.mutation<CreatedApiKey, { name: string }>({
      query: (body) => ({ url: '/me/api-keys', method: 'POST', body }),
      invalidatesTags: ['ApiKey'],
      transformResponse: (response: { data: CreatedApiKey } | CreatedApiKey) =>
        (response as any).data || response,
    }),
    revokeApiKey: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/me/api-keys/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ApiKey'],
      transformResponse: (response: { data: any } | any) => (response as any).data || response,
    }),

    // --- Webhooks ---
    getWebhooks: builder.query<StoreWebhook[], void>({
      query: () => '/me/webhooks',
      providesTags: ['Webhook'],
      transformResponse: (response: { data: StoreWebhook[] } | StoreWebhook[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    createWebhook: builder.mutation<
      StoreWebhook,
      { targetUrl: string; events: WebhookEvent[]; isActive?: boolean }
    >({
      query: (body) => ({ url: '/me/webhooks', method: 'POST', body }),
      invalidatesTags: ['Webhook'],
      transformResponse: (response: { data: StoreWebhook } | StoreWebhook) =>
        (response as any).data || response,
    }),
    updateWebhook: builder.mutation<
      StoreWebhook,
      { id: string; data: { targetUrl?: string; events?: WebhookEvent[]; isActive?: boolean } }
    >({
      query: ({ id, data }) => ({ url: `/me/webhooks/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Webhook'],
      transformResponse: (response: { data: StoreWebhook } | StoreWebhook) =>
        (response as any).data || response,
    }),
    deleteWebhook: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/me/webhooks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Webhook'],
      transformResponse: (response: { data: any } | any) => (response as any).data || response,
    }),
    testWebhook: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/me/webhooks/${id}/test`, method: 'POST' }),
      invalidatesTags: ['Webhook'],
      // The API envelope hoists a service's `message` to the top level and nulls
      // `data`, so read the result from the envelope rather than from `data`.
      transformResponse: (response: any) => ({
        success: response?.data?.success ?? response?.success ?? false,
        message: response?.message || 'Test event dispatched.',
      }),
    }),

    getAvailableThemes: builder.query<ThemeCatalogResponse, void>({
      query: () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/stores', '') || 'http://localhost:5001/api/v1';
        return {
          url: `${baseUrl}/tenant/themes`,
        };
      },
      providesTags: ['Themes'],
      transformResponse: (response: { data: ThemeCatalogResponse } | ThemeCatalogResponse) =>
        (response as any).data || response,
    }),
    initiateThemePayment: builder.mutation<
      { isFree: boolean; gatewayUrl?: string; message?: string; tranId?: string },
      string
    >({
      query: (themeId) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/stores', '') || 'http://localhost:5001/api/v1';
        return {
          url: `${baseUrl}/tenant/themes/${themeId}/initiate-payment`,
          method: 'POST',
        };
      },
      invalidatesTags: ['Store', 'Themes'],
      transformResponse: (response: { data: any } | any) => (response as any).data || response,
    }),
    activateTheme: builder.mutation<{ success: boolean; message: string; activeThemeId: string }, string>({
      query: (themeId) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/stores', '') || 'http://localhost:5001/api/v1';
        return {
          url: `${baseUrl}/tenant/themes/${themeId}/activate`,
          method: 'POST',
        };
      },
      invalidatesTags: ['Store', 'Themes'],
      transformResponse: (response: { data: any } | any) => (response as any).data || response,
    }),
  }),
});

export const {
  useGetMyStoresQuery,
  useGetMyStoreQuery,
  useGetStoreBySlugQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteMyStoreMutation,
  useGetDeliveryZonesQuery,
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
  useDeleteDeliveryZoneMutation,
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
  useGetWebhooksQuery,
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
  useGetAvailableThemesQuery,
  useInitiateThemePaymentMutation,
  useActivateThemeMutation,
} = tenantApi;
