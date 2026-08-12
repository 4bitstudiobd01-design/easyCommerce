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
  discountAmount: number;
  couponCode?: string;
  grandTotal: number;
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  orderStatus: OrderStatusType;
  storeSlug: string;
  tenantId: string;
  items: OrderItem[];
  createdAt: string;
}

export interface AbandonedCart {
  id: string;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  itemsJson: any[];
  totalAmount: number;
  recoveryToken: string;
  isRecovered: boolean;
  lastRemindedAt?: string;
  tenantId: string;
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
  couponCode?: string;
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
      const activeStoreId = localStorage.getItem('easycommerce_active_store_id');
      if (activeStoreId) {
        headers.set('x-store-id', activeStoreId);
      }
      return headers;
    },
  }),
  tagTypes: ['Order', 'AbandonedCart'],
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

    // --- ABANDONED CART RECOVERY ENDPOINTS ---
    getMerchantAbandonedCarts: builder.query<AbandonedCart[], void>({
      query: () => ({
        url: 'http://localhost:5001/api/v1/orders/abandoned-carts/merchant',
        method: 'GET',
      }),
      providesTags: ['AbandonedCart'],
      transformResponse: (response: { data: AbandonedCart[] } | AbandonedCart[]) =>
        Array.isArray(response) ? response : response.data || [],
    }),
    sendRecoverySms: builder.mutation<{ message: string }, string>({
      query: (cartId) => ({
        url: `http://localhost:5001/api/v1/orders/abandoned-carts/${cartId}/send-recovery-sms`,
        method: 'POST',
      }),
      invalidatesTags: ['AbandonedCart'],
    }),
    trackAbandonedCart: builder.mutation<AbandonedCart, {
      storeSlug: string;
      customerPhone: string;
      customerName?: string;
      customerEmail?: string;
      shippingAddress?: string;
      itemsJson: any[];
      totalAmount: number;
    }>({
      query: (body) => ({
        url: 'http://localhost:5001/api/v1/orders/abandoned-carts/track',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useCreatePublicOrderMutation,
  useTrackPublicOrderQuery,
  useLazyTrackPublicOrderQuery,
  useGetMerchantOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetMerchantAbandonedCartsQuery,
  useSendRecoverySmsMutation,
  useTrackAbandonedCartMutation,
} = orderApi;
