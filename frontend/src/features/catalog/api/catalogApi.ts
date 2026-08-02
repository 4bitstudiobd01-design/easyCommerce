import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  image?: string;
  isFeatured?: boolean;
  parentCategory?: Category;
  subcategories?: Category[];
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

export interface Review {
  id: string;
  rating: number;
  reviewerName: string;
  reviewerEmail?: string;
  comment: string;
  images?: string[];
  isVerifiedBuyer: boolean;
  isApproved: boolean;
  productId: string;
  product?: Product;
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
  parentId?: string;
  icon?: string;
  image?: string;
  isFeatured?: boolean;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  reviewerName: string;
  reviewerEmail?: string;
  comment: string;
  images?: string[];
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
      const activeStoreId = localStorage.getItem('easycommerce_active_store_id');
      if (activeStoreId) {
        headers.set('x-store-id', activeStoreId);
      }
      return headers;
    },
  }),
  tagTypes: ['Product', 'Category', 'Review'],
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

    // --- REVIEWS ENDPOINTS ---
    getApprovedReviews: builder.query<{ reviews: Review[]; avgRating: number; totalCount: number }, string>({
      query: (productId) => `/products/${productId}/reviews`,
      providesTags: ['Review'],
      transformResponse: (response: { data: { reviews: Review[]; avgRating: number; totalCount: number } }) => response.data,
    }),
    getMerchantReviews: builder.query<Review[], void>({
      query: () => '/reviews/merchant',
      providesTags: ['Review'],
      transformResponse: (response: { data: Review[] }) => response.data,
    }),
    createReview: builder.mutation<Review, CreateReviewRequest>({
      query: ({ productId, ...body }) => ({
        url: `/products/${productId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Review'],
      transformResponse: (response: { data: Review }) => response.data,
    }),
    toggleReviewApproval: builder.mutation<Review, { id: string; isApproved: boolean }>({
      query: ({ id, isApproved }) => ({
        url: `/reviews/${id}/approve`,
        method: 'PATCH',
        body: { isApproved },
      }),
      invalidatesTags: ['Review'],
      transformResponse: (response: { data: Review }) => response.data,
    }),
    deleteReview: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useCreateCategoryMutation,
  useGetApprovedReviewsQuery,
  useGetMerchantReviewsQuery,
  useCreateReviewMutation,
  useToggleReviewApprovalMutation,
  useDeleteReviewMutation,
} = catalogApi;
