import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export interface InitiatePaymentResponse {
  gatewayUrl: string;
  tranId: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  tranId: string;
  valId?: string;
  amount: number;
  currency: string;
  cardType?: string;
  bankTranId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/payments',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Payment'],
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<InitiatePaymentResponse, { orderId: string }>({
      query: (body) => ({
        url: '/initiate',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: InitiatePaymentResponse }) => response.data,
    }),
    getMerchantPayments: builder.query<PaymentRecord[], void>({
      query: () => '',
      providesTags: ['Payment'],
      transformResponse: (response: { data: PaymentRecord[] }) => response.data,
    }),
  }),
});

export const { useInitiatePaymentMutation, useGetMerchantPaymentsQuery } = paymentApi;
