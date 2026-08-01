import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export interface Store {
  id: string;
  name: string;
  slug: string;
  category?: string;
  phone?: string;
  address?: string;
  logo?: string;
  currency: string;
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

export const tenantApi = createApi({
  reducerPath: 'tenantApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/stores',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Store'],
  endpoints: (builder) => ({
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
  }),
});

export const { useGetMyStoreQuery, useGetStoreBySlugQuery, useCreateStoreMutation } = tenantApi;
