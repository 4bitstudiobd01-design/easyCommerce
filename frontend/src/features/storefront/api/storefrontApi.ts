import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Store } from '@/features/tenant/api/tenantApi';
import { Product, HomepageSection } from '@/features/catalog/api/catalogApi';

export interface PublicStorefrontResponse {
  store: Store;
  products: Product[];
}

export interface PublicStoreProductResponse {
  store: Store;
  product: Product;
}

export interface PublicStoreCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1')
  .replace(/\/+$/, '')
  .replace(/\/catalog\/public$/, '');

export const storefrontApi = createApi({
  reducerPath: 'storefrontApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_ROOT}/catalog/public`,
  }),
  tagTypes: ['PublicStorefront'],
  endpoints: (builder) => ({
    getPublicStoreProducts: builder.query<PublicStorefrontResponse, { slug: string; section?: HomepageSection }>({
      query: ({ slug, section }) => `/store/${slug}/products${section ? `?section=${section}` : ''}`,
      providesTags: ['PublicStorefront'],
      transformResponse: (response: { data: PublicStorefrontResponse }) => response.data,
    }),
    getPublicStoreProductBySlug: builder.query<PublicStoreProductResponse, { storeSlug: string; productSlug: string }>({
      query: ({ storeSlug, productSlug }) => `/store/${storeSlug}/products/${productSlug}`,
      providesTags: (result, error, arg) => [{ type: 'PublicStorefront', id: arg.productSlug }],
      transformResponse: (response: { data: PublicStoreProductResponse }) => response.data,
    }),
    getPublicStoreCategories: builder.query<PublicStoreCategory[], { slug: string; limit?: number }>({
      query: ({ slug, limit }) =>
        `/store/${slug}/categories${limit !== undefined ? `?limit=${limit}` : ''}`,
      providesTags: ['PublicStorefront'],
      transformResponse: (response: { data: PublicStoreCategory[] }) => response.data || [],
    }),
  }),
});

export const {
  useGetPublicStoreProductsQuery,
  useGetPublicStoreProductBySlugQuery,
  useGetPublicStoreCategoriesQuery,
} = storefrontApi;
