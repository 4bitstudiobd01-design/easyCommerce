import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export type OrderStatusType =
  | 'PENDING'
  | 'ON_HOLD'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'PAYMENT_ON_PROCESS'
  | 'PAYMENT_FAILED';

export interface OrderKpiMetrics {
  totalOrders: number;
  pendingConfirmation: number;
  readyToShip: number;
  delivered: number;
  statusCounts?: Record<string, number>;
  trends?: {
    totalOrders: number | null;
    delivered: number | null;
  };
}

export interface OrderConsignmentSummary {
  id: string;
  status: string;
  courierProvider: string;
  trackingCode?: string;
  deliveryCharge: number;
  /** Populated only on the single-order endpoint, not the list endpoint. */
  lastSyncAt?: string;
  events?: any[];
}

export interface OrderItem {
  id: string;
  productId?: string | null;
  productTitle: string;
  sku?: string;
  /** Denormalized catalog product image; null/absent for custom items. */
  productImageUrl?: string | null;
  /** True for a merchant-entered line with no catalog product behind it. */
  isCustomItem?: boolean;
  unitPrice: number;
  quantity: number;
  /** Per-line discount, separate from the order-wide discountAmount. */
  discountAmount?: number;
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
  area?: string;
  thana?: string;
  district?: string;
  division?: string;
  city: string;
  deliveryFee: number;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  grandTotal: number;
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ';
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED' | 'COD_PENDING' | 'COD_COLLECTED' | 'FAILED';
  orderStatus: OrderStatusType;
  storeSlug: string;
  tenantId: string;
  items: OrderItem[];
  customerNote?: string;
  internalNote?: string;
  consignment?: OrderConsignmentSummary;
  statusHistory?: any[];
  channel?: string;
  utmSource?: string;
  utmMedium?: string;
  createdAt: string;
}

export interface InvoiceData {
  order: Order;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  amountPaid: number;
  balanceDue: number;
  generatedAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'STATUS_CHANGE' | 'ORDER_EDITED' | 'INTERNAL_NOTE' | 'CUSTOMER_COMMUNICATION' | 'SHIPMENT' | 'RETURN';
  title: string;
  description?: string;
  actor: string;
  timestamp: string;
  metadata?: any;
}

export interface PaginatedTimeline {
  events: TimelineEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
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
  channel?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerHost?: string;
  sessionId?: string;
}

export interface EditOrderItemRequest {
  /** Required unless isCustomItem is true. */
  productId?: string;
  /** True for a merchant-entered line with no catalog product. */
  isCustomItem?: boolean;
  /** Required when isCustomItem is true. */
  customTitle?: string;
  /** Required when isCustomItem is true. */
  customUnitPrice?: number;
  quantity: number;
  /** Per-line discount, separate from the order-wide discountAmount. */
  discountAmount?: number;
}

export interface EditOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  area?: string;
  thana?: string;
  district?: string;
  division?: string;
  customerNote?: string;
  internalNote?: string;
  deliveryFee: number;
  discountAmount: number;
  items: EditOrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  id: string;
  orderStatus: OrderStatusType;
  reason?: string;
}

export interface ReturnItem {
  id: string;
  orderItemId: string;
  quantity: number;
  reason?: string;
  condition?: string;
  restockDecision?: boolean;
  inspectionNote?: string;
  orderItem: OrderItem;
}

export interface Return {
  id: string;
  returnNumber: string;
  orderId: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PICKUP_PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'INSPECTED' | 'ACCEPTED' | 'CANCELLED';
  reason?: string;
  note?: string;
  rejectionReason?: string;
  items: ReturnItem[];
  requestedAt: string;
}

export interface Refund {
  id: string;
  refundNumber: string;
  orderId: string;
  paymentId: string;
  returnId?: string;
  amount: number;
  currency: string;
  method: string;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reason?: string;
  createdAt: string;
}

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/orders'),
  tagTypes: ['Order', 'AbandonedCart', 'OrderKpi'],
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
    getMerchantOrders: builder.query<{ data: Order[]; meta: any }, { page?: number; limit?: number; status?: string; paymentStatus?: string; search?: string; sortBy?: string; sortOrder?: string; } | void>({
      query: (params) => ({
        url: '',
        params: params || {},
      }),
      providesTags: ['Order'],
      // The controller returns { data, meta } and the response interceptor wraps it
      // again, so the body is { data: { data: Order[], meta } }. Unwrap the envelope
      // and always hand consumers an array, never an object.
      transformResponse: (response: any) => {
        const payload = response?.data ?? response;
        const data = Array.isArray(payload) ? payload : payload?.data;
        return {
          data: Array.isArray(data) ? data : [],
          meta: payload?.meta ?? response?.meta ?? null,
        };
      },
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
      transformResponse: (response: { data: Order }) => response.data,
    }),
    getOrderInvoice: builder.query<InvoiceData, string>({
      query: (id) => `/${id}/invoice`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
      transformResponse: (response: { data: InvoiceData }) => response.data,
    }),
    getMerchantOrderKpis: builder.query<OrderKpiMetrics, void>({
      query: () => '/kpi',
      providesTags: ['OrderKpi', 'Order'],
      transformResponse: (response: { data: any }) => response.data,
    }),
    editOrder: builder.mutation<Order, { id: string; data: EditOrderRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order'],
      transformResponse: (response: { data: Order }) => response.data,
    }),
    updateOrderStatus: builder.mutation<Order, UpdateOrderStatusRequest>({
      query: ({ id, orderStatus, reason }) => ({
        url: `/${id}/status`,
        method: 'PATCH',
        body: { orderStatus, reason },
      }),
      invalidatesTags: ['Order'],
      transformResponse: (response: { data: Order }) => response.data,
    }),
    updateOrderPaymentStatus: builder.mutation<Order, { id: string; paymentStatus: string }>({
      query: ({ id, paymentStatus }) => ({
        url: `/${id}/payment-status`,
        method: 'PATCH',
        body: { paymentStatus },
      }),
      invalidatesTags: ['Order'],
      transformResponse: (response: { data: Order }) => response.data,
    }),

    // --- ABANDONED CART RECOVERY ENDPOINTS ---
    getMerchantAbandonedCarts: builder.query<AbandonedCart[], void>({
      query: () => ({
        url: '/abandoned-carts/merchant',
        method: 'GET',
      }),
      providesTags: ['AbandonedCart'],
      transformResponse: (response: { data: AbandonedCart[] } | AbandonedCart[]) =>
        Array.isArray(response) ? response : response.data || [],
    }),
    sendRecoverySms: builder.mutation<{ message: string }, string>({
      query: (cartId) => ({
        url: `/abandoned-carts/${cartId}/send-recovery-sms`,
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
        url: '/abandoned-carts/track',
        method: 'POST',
        body,
      }),
    }),

    // --- CHUNK 8: COD PAYMENT ENDPOINT ---
    collectCodPayment: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/${id}/payment/cod/collect`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Order', id },
      ],
      transformResponse: (response: { data: Order }) => response.data,
    }),
    undoCollectCodPayment: builder.mutation<Order, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/${id}/payment/cod/undo-collect`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
      ],
      transformResponse: (response: { data: Order }) => response.data,
    }),

    // --- CHUNK 9: RETURNS & REFUNDS ENDPOINTS ---
    getReturnsByOrder: builder.query<Return[], string>({
      query: (orderId) => `/${orderId}/returns`,
      providesTags: (result, error, arg) => [{ type: 'Order', id: arg }],
    }),
    createReturn: builder.mutation<Return, { orderId: string; items: { orderItemId: string; quantity: number; reason: string }[]; note?: string }>({
      query: ({ orderId, ...body }) => ({
        url: `/${orderId}/returns`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Order', id: arg.orderId }],
    }),
    updateReturnStatus: builder.mutation<Return, { orderId: string; returnId: string; status: string; rejectionReason?: string; condition?: string; inspectionNote?: string; restockDecision?: boolean }>({
      query: ({ orderId, returnId, ...body }) => ({
        url: `/${orderId}/returns/${returnId}/status`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Order', id: arg.orderId }],
    }),
    getRefundsByOrder: builder.query<Refund[], string>({
      query: (orderId) => `/${orderId}/refunds`,
      providesTags: (result, error, arg) => [{ type: 'Order', id: arg }],
    }),
    createRefund: builder.mutation<Refund, { orderId: string; amount: number; returnId?: string; reason?: string }>({
      query: ({ orderId, ...body }) => ({
        url: `/${orderId}/refunds`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Order', id: arg.orderId }],
    }),
    processRefund: builder.mutation<Refund, { orderId: string; refundId: string }>({
      query: ({ orderId, refundId }) => ({
        url: `/${orderId}/refunds/${refundId}/process`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Order', id: arg.orderId }],
    }),
    
    // --- CHUNK 10: BULK OPERATIONS ---
    bulkUpdateOrderStatus: builder.mutation<{ total: number; successful: number; failed: number; errors: any[] }, { orderIds?: string[]; selectAllMatching?: boolean; filters?: any; targetStatus: OrderStatusType; reason?: string }>({
      query: (body) => ({
        url: '/bulk/status',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'OrderKpi'],
      transformResponse: (response: { data: { total: number; successful: number; failed: number; errors: any[] } }) => response.data,
    }),

    // --- CHUNK 11: NOTES & TIMELINE ---
    getOrderTimeline: builder.query<PaginatedTimeline, { orderId: string; page?: number; limit?: number }>({
      query: ({ orderId, page = 1, limit = 10 }) => `/${orderId}/timeline?page=${page}&limit=${limit}`,
      providesTags: (result, error, { orderId }) => [{ type: 'Order', id: `${orderId}-timeline` }],
      transformResponse: (response: { data: PaginatedTimeline }) => response.data,
    }),
    getOrderNotes: builder.query<any[], string>({
      query: (orderId) => `/${orderId}/notes`,
      providesTags: (result, error, id) => [{ type: 'Order', id: `${id}-notes` }],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    createOrderNote: builder.mutation<any, { orderId: string; content: string; isCustomerVisible?: boolean }>({
      query: ({ orderId, ...body }) => ({
        url: `/${orderId}/notes`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Order', id: `${arg.orderId}-notes` },
        { type: 'Order', id: `${arg.orderId}-timeline` },
      ],
    }),
  }),
});

export const {
  useCreatePublicOrderMutation,
  useTrackPublicOrderQuery,
  useLazyTrackPublicOrderQuery,
  useGetMerchantOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderInvoiceQuery,
  useGetMerchantOrderKpisQuery,
  useEditOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderPaymentStatusMutation,
  useGetMerchantAbandonedCartsQuery,
  useSendRecoverySmsMutation,
  useTrackAbandonedCartMutation,
  useCollectCodPaymentMutation,
  useUndoCollectCodPaymentMutation,
  useGetReturnsByOrderQuery,
  useCreateReturnMutation,
  useUpdateReturnStatusMutation,
  useGetRefundsByOrderQuery,
  useCreateRefundMutation,
  useProcessRefundMutation,
  useBulkUpdateOrderStatusMutation,
  useGetOrderTimelineQuery,
  useGetOrderNotesQuery,
  useCreateOrderNoteMutation,
} = orderApi;
