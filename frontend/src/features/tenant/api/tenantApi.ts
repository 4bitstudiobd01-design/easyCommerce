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
  tagTypes: ['Store'],
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
  }),
});

export const {
  useGetMyStoresQuery,
  useGetMyStoreQuery,
  useGetStoreBySlugQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
} = tenantApi;
