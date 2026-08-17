import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorName: string;
  category: string;
  coverImageUrl: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  readingMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  authorName?: string;
  category?: string;
  status?: BlogPostStatus;
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/stores').replace(
  /\/(admin|stores|auth)$/,
  '',
);

export const blogApi = createApi({
  reducerPath: 'blogApi',
  baseQuery: createBaseQueryWithReauth(`${API_ROOT}/blog`),
  tagTypes: ['BlogPost'],
  endpoints: (builder) => ({
    getAllPosts: builder.query<BlogPost[], void>({
      query: () => '/posts/admin',
      providesTags: ['BlogPost'],
      transformResponse: (response: { data: BlogPost[] }) => response.data,
    }),
    createPost: builder.mutation<BlogPost, BlogPostInput>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: ['BlogPost'],
      transformResponse: (response: { data: BlogPost }) => response.data,
    }),
    updatePost: builder.mutation<BlogPost, { id: string; body: Partial<BlogPostInput> }>({
      query: ({ id, body }) => ({ url: `/posts/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['BlogPost'],
      transformResponse: (response: { data: BlogPost }) => response.data,
    }),
    deletePost: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['BlogPost'],
      transformResponse: (response: { data: { id: string } }) => response.data,
    }),
  }),
});

export const {
  useGetAllPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = blogApi;
