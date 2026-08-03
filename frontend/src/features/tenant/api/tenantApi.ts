import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
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
  ownerId: string;
  tenantId: string;
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
}

export const tenantApi = createApi({
  reducerPath: 'tenantApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/stores',
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
  tagTypes: ['Store', 'Themes'],
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
    purchaseTheme: builder.mutation<
      { success: boolean; message: string; activeThemeId: string; unlockedThemeIds: string[] },
      string
    >({
      query: (themeId) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/stores', '') || 'http://localhost:5001/api/v1';
        return {
          url: `${baseUrl}/tenant/themes/${themeId}/purchase`,
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
  useGetAvailableThemesQuery,
  useInitiateThemePaymentMutation,
  usePurchaseThemeMutation,
  useActivateThemeMutation,
} = tenantApi;
