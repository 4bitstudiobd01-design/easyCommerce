import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
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
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/payments'),
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
