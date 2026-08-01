import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Store } from '@/features/tenant/api/tenantApi';
import { Product } from '@/features/catalog/api/catalogApi';

export interface PublicStorefrontResponse {
  store: Store;
  products: Product[];
}

export const storefrontApi = createApi({
  reducerPath: 'storefrontApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/catalog/public',
  }),
  tagTypes: ['PublicStorefront'],
  endpoints: (builder) => ({
    getPublicStoreProducts: builder.query<PublicStorefrontResponse, string>({
      query: (slug) => `/store/${slug}/products`,
      providesTags: ['PublicStorefront'],
      transformResponse: (response: { data: PublicStorefrontResponse }) => response.data,
    }),
  }),
});

export const { useGetPublicStoreProductsQuery } = storefrontApi;
