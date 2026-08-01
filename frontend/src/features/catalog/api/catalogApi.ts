import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  basePrice: number;
  compareAtPrice?: number;
  isPublished: boolean;
  categoryId?: string;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  tenantId: string;
  createdAt: string;
}

export interface CreateProductRequest {
  title: string;
  description?: string;
  basePrice: number;
  compareAtPrice?: number;
  sku: string;
  categoryId?: string;
  imageUrl?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/catalog',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Product', 'Category'],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => '/products',
      providesTags: ['Product'],
      transformResponse: (response: { data: Product[] }) => response.data,
    }),
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Category'],
      transformResponse: (response: { data: Category[] }) => response.data,
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (productData) => ({
        url: '/products',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: ['Product'],
      transformResponse: (response: { data: Product }) => response.data,
    }),
    createCategory: builder.mutation<Category, CreateCategoryRequest>({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['Category'],
      transformResponse: (response: { data: Category }) => response.data,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useCreateCategoryMutation,
} = catalogApi;
