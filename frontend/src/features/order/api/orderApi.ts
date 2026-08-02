import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export type OrderStatusType =
  | 'PENDING'
  | 'ON_HOLD'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'PAYMENT_ON_PROCESS'
  | 'PAYMENT_FAILED';

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface PublicOrderTracking {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  grandTotal: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatusType;
  createdAt: string;
  items: {
    productId: string;
    productTitle: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }[];
  consignment?: {
    trackingCode: string;
    courierProvider: string;
    status: string;
    codAmount: number;
    createdAt: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  deliveryFee: number;
  subtotal: number;
  grandTotal: number;
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  orderStatus: OrderStatusType;
  storeSlug: string;
  tenantId: string;
  items: OrderItem[];
  createdAt: string;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  storeSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ';
  items: CreateOrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  id: string;
  orderStatus: OrderStatusType;
}

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/orders',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Order'],
  endpoints: (builder) => ({
    createPublicOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (orderData) => ({
        url: '/public/checkout',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Order'],
      transformResponse: (response: { data: Order }) => response.data,
    }),
    trackPublicOrder: builder.query<PublicOrderTracking[], { query: string; storeSlug?: string } | string>({
      query: (arg) => {
        const queryStr = typeof arg === 'string' ? arg : arg.query;
        const slugStr = typeof arg === 'object' && arg.storeSlug ? `&storeSlug=${encodeURIComponent(arg.storeSlug)}` : '';
        return `/public/track?query=${encodeURIComponent(queryStr)}${slugStr}`;
      },
      transformResponse: (response: { data: PublicOrderTracking[] }) => response.data,
    }),
    getMerchantOrders: builder.query<Order[], void>({
      query: () => '',
      providesTags: ['Order'],
      transformResponse: (response: { data: Order[] }) => response.data,
    }),
    updateOrderStatus: builder.mutation<Order, UpdateOrderStatusRequest>({
      query: ({ id, orderStatus }) => ({
        url: `/${id}/status`,
        method: 'PATCH',
        body: { orderStatus },
      }),
      invalidatesTags: ['Order'],
      transformResponse: (response: { data: Order }) => response.data,
    }),
  }),
});

export const {
  useCreatePublicOrderMutation,
  useTrackPublicOrderQuery,
  useLazyTrackPublicOrderQuery,
  useGetMerchantOrdersQuery,
  useUpdateOrderStatusMutation,
} = orderApi;
