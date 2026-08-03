import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ProductSeoMetadata {
  productId: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  sku?: string;
  images: string[];
  mainImage: string;
  inStock: boolean;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
  canonicalUrl: string;
  jsonLdSchema: Record<string, any>;
  openGraphTags: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    priceAmount: number;
    priceCurrency: string;
  };
}

export interface StoreSeoMetadata {
  storeId: string;
  storeName: string;
  storeSlug: string;
  metaTitle: string;
  metaDescription: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  canonicalUrl: string;
  jsonLdSchema: Record<string, any>;
  openGraphTags: {
    title: string;
    description: string;
    image?: string;
    url: string;
    type: string;
  };
}

export const seoApi = createApi({
  reducerPath: 'seoApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1',
  }),
  tagTypes: ['SeoMetadata'],
  endpoints: (builder) => ({
    getStoreSeo: builder.query<StoreSeoMetadata, string>({
      query: (slug) => `/seo/public/store/${slug}`,
      providesTags: ['SeoMetadata'],
      transformResponse: (response: { data: StoreSeoMetadata } | StoreSeoMetadata) =>
        (response as any).data || response,
    }),
    getProductSeo: builder.query<ProductSeoMetadata, string>({
      query: (productId) => `/seo/public/product/${productId}`,
      providesTags: ['SeoMetadata'],
      transformResponse: (response: { data: ProductSeoMetadata } | ProductSeoMetadata) =>
        (response as any).data || response,
    }),
  }),
});

export const { useGetStoreSeoQuery, useGetProductSeoQuery } = seoApi;
