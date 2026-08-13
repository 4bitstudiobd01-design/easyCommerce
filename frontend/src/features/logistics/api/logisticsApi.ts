import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export interface Consignment {
  id: string;
  trackingCode: string;
  orderId: string;
  orderNumber: string;
  courierProvider: 'STEADFAST' | 'PATHAO' | 'PAPERFLY';
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  codAmount: number;
  deliveryCharge: number;
  status: 'BOOKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  tenantId: string;
  createdAt: string;
}

export interface CreateCourierBookingRequest {
  orderId: string;
  courierProvider: 'STEADFAST' | 'PATHAO' | 'PAPERFLY';
  note?: string;
}

export const logisticsApi = createApi({
  reducerPath: 'logisticsApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/logistics'),
  tagTypes: ['Consignment'],
  endpoints: (builder) => ({
    bookCourier: builder.mutation<Consignment, CreateCourierBookingRequest>({
      query: (body) => ({
        url: '/book',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Consignment'],
      transformResponse: (response: { data: Consignment }) => response.data,
    }),
    getMerchantConsignments: builder.query<Consignment[], void>({
      query: () => '/consignments',
      providesTags: ['Consignment'],
      transformResponse: (response: { data: Consignment[] }) => response.data,
    }),
    syncConsignment: builder.mutation<Consignment, string>({
      query: (orderId) => ({
        url: `/consignments/order/${orderId}/sync`,
        method: 'POST',
      }),
      invalidatesTags: ['Consignment'],
      transformResponse: (response: { data: Consignment }) => response.data,
    }),
  }),
});

export const { useBookCourierMutation, useGetMerchantConsignmentsQuery, useSyncConsignmentMutation } = logisticsApi;
