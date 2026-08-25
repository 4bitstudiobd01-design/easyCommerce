import { createApi } from '@reduxjs/toolkit/query/react';
import { createCustomerBaseQueryWithReauth } from '@/store/customerBaseQueryWithReauth';
import { CustomerUser } from '../slices/customerAuthSlice';

export interface UpdateMyProfileRequest {
  storeSlug: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface MyOrderItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  grandTotal: number;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  itemsCount: number;
  courierProvider?: string;
  consignmentStatus?: string;
  trackingCode?: string;
}

export interface MyOrdersResponse {
  data: MyOrderItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const customerAccountApi = createApi({
  reducerPath: 'customerAccountApi',
  baseQuery: createCustomerBaseQueryWithReauth(),
  tagTypes: ['MyProfile', 'MyOrders'],
  endpoints: (builder) => ({
    getMyProfile: builder.query<CustomerUser, { storeSlug: string }>({
      query: ({ storeSlug }) => `/${storeSlug}/account/me`,
      transformResponse: (response: { data: CustomerUser }) => response.data,
      providesTags: ['MyProfile'],
    }),
    updateMyProfile: builder.mutation<CustomerUser, UpdateMyProfileRequest>({
      query: ({ storeSlug, ...body }) => ({
        url: `/${storeSlug}/account/me`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: { data: CustomerUser }) => response.data,
      invalidatesTags: ['MyProfile'],
    }),
    getMyOrders: builder.query<MyOrdersResponse, { storeSlug: string; page?: number; limit?: number; status?: string; search?: string }>({
      query: ({ storeSlug, ...params }) => ({
        url: `/${storeSlug}/account/orders`,
        params,
      }),
      transformResponse: (response: { data: MyOrdersResponse }) => response.data,
      providesTags: ['MyOrders'],
    }),
  }),
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation, useGetMyOrdersQuery } = customerAccountApi;
