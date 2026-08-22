import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

export interface InitiatePaymentResponse {
  gatewayUrl: string;
  tranId: string;
}

export type PaymentTransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export type PaymentGatewayCode =
  | 'SSLCOMMERZ'
  | 'BKASH'
  | 'NAGAD'
  | 'STRIPE'
  | 'PAYPAL'
  | 'COD'
  | 'MANUAL';

export type PaymentMethodType =
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'UPAY'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'COD';

export type PaymentDateRangePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | '90d'
  | 'custom';

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
  status: PaymentTransactionStatus;
  createdAt: string;
}

export interface PaymentTransactionCustomer {
  id?: string;
  name: string;
  phone?: string;
}

export interface PaymentTransaction {
  id: string;
  transactionNumber: string;
  gatewayTransactionId?: string;
  orderId: string;
  orderNumber: string;
  customer: PaymentTransactionCustomer;
  gateway: PaymentGatewayCode;
  gatewayLabel: string;
  paymentMethod: PaymentMethodType;
  paymentMethodLabel: string;
  amount: number;
  refundedAmount: number;
  currency: string;
  status: PaymentTransactionStatus;
  isRefundable: boolean;
  createdAt: string;
  paidAt?: string;
}

export interface PaymentPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaymentTransactionListResponse {
  data: PaymentTransaction[];
  meta: PaymentPaginationMeta;
}

export interface PaymentKpiMetric {
  amount: number;
  count: number;
  previousAmount: number;
  /** Null when there is no comparable baseline — render a dash, not a number. */
  changePercent: number | null;
}

export interface PaymentOverviewSlice {
  label: string;
  amount: number;
  percentage: number;
}

export interface PaymentTopMethod {
  method: PaymentMethodType;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface PaymentGatewaySummary {
  id: string;
  code: PaymentGatewayCode;
  name: string;
  kind: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'DISABLED';
  isEnabled: boolean;
}

export interface PaymentSummaryResponse {
  totalReceived: PaymentKpiMetric;
  paid: PaymentKpiMetric;
  pending: PaymentKpiMetric;
  refunded: PaymentKpiMetric;
  overview: PaymentOverviewSlice[];
  topPaymentMethods: PaymentTopMethod[];
  gateways: PaymentGatewaySummary[];
  currency: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface PaymentTimelineEvent {
  id: string;
  type: string;
  label: string;
  message?: string;
  createdAt: string;
}

export interface PaymentRefundSummary {
  id: string;
  refundNumber: string;
  amount: number;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentDetails {
  id: string;
  transactionNumber: string;
  gatewayTransactionId?: string;
  orderId: string;
  orderNumber: string;
  customer: PaymentTransactionCustomer;
  gateway: PaymentGatewayCode;
  gatewayLabel: string;
  paymentMethod: PaymentMethodType;
  paymentMethodLabel: string;
  amount: number;
  refundedAmount: number;
  netAmount: number;
  currency: string;
  status: PaymentTransactionStatus;
  isRefundable: boolean;
  failureReason?: string;
  createdAt: string;
  paidAt?: string;
  refunds: PaymentRefundSummary[];
  timeline: PaymentTimelineEvent[];
}

export interface ListPaymentTransactionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentTransactionStatus;
  gateway?: PaymentGatewayCode;
  paymentMethod?: PaymentMethodType;
  dateRange?: PaymentDateRangePreset;
  dateFrom?: string;
  dateTo?: string;
  timezone?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  sortBy?: 'createdAt' | 'amount' | 'status' | 'orderNumber';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SeedPaymentDemoDataResponse {
  success: boolean;
  message: string;
  gatewaysCreated: number;
  ordersCreated: number;
  paymentsCreated: number;
  refundsCreated: number;
  eventsCreated: number;
}

export interface OrderBalance {
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
}

/** One row from an order's own payment history (distinct from the tenant-wide PaymentTransaction list). */
export interface OrderPaymentEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  transactionNumber?: string;
  tranId: string;
  amount: number;
  refundedAmount: number;
  currency: string;
  gateway: PaymentGatewayCode;
  paymentMethod: PaymentMethodType;
  status: PaymentTransactionStatus;
  paidAt?: string;
  createdAt: string;
}

export type ManualPaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER' | 'OTHER';

export interface RecordManualPaymentParams {
  orderId: string;
  amount: number;
  method: ManualPaymentMethod;
  note?: string;
}

export interface CreatePaymentLinkParams {
  orderId: string;
  amount?: number;
  sendSms?: boolean;
}

export interface PaymentLinkResult {
  gatewayUrl: string;
  tranId: string;
  amount: number;
}

/** Unwraps the platform's `{ success, data }` envelope when present. */
const unwrap = <T,>(response: unknown): T => {
  const payload = response as { data?: T } | T;
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

/** Strips empty values so cleared filters do not appear as `?status=` in the URL. */
const toQueryParams = (params?: ListPaymentTransactionsParams): Record<string, string | number> => {
  const result: Record<string, string | number> = {};
  if (!params) return result;
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    result[key] = value as string | number;
  });
  return result;
};

const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/(orders|payments)$/, '') ||
  'http://localhost:5001/api/v1';

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: createBaseQueryWithReauth(API_ROOT),
  tagTypes: ['Payment', 'PaymentTransaction', 'PaymentSummary', 'PaymentGateway', 'OrderBalance', 'OrderPaymentHistory'],
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<InitiatePaymentResponse, { orderId: string }>({
      query: (body) => ({
        url: '/payments/initiate',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => unwrap<InitiatePaymentResponse>(response),
    }),

    getMerchantPayments: builder.query<PaymentRecord[], void>({
      query: () => '/payments',
      providesTags: ['Payment'],
      transformResponse: (response: unknown) => {
        const data = unwrap<PaymentRecord[]>(response);
        return Array.isArray(data) ? data : [];
      },
    }),

    getPaymentTransactions: builder.query<
      PaymentTransactionListResponse,
      ListPaymentTransactionsParams | void
    >({
      query: (params) => ({
        url: '/payments/transactions',
        params: toQueryParams(params || undefined),
      }),
      providesTags: ['PaymentTransaction'],
      transformResponse: (response: unknown): PaymentTransactionListResponse => {
        const payload = unwrap<PaymentTransactionListResponse>(response);
        return {
          data: Array.isArray(payload?.data) ? payload.data : [],
          meta: payload?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
      },
    }),

    getPaymentSummary: builder.query<
      PaymentSummaryResponse,
      ListPaymentTransactionsParams | void
    >({
      query: (params) => ({
        url: '/payments/transactions/summary',
        params: toQueryParams(params || undefined),
      }),
      providesTags: ['PaymentSummary'],
      transformResponse: (response: unknown) => unwrap<PaymentSummaryResponse>(response),
    }),

    getPaymentDetails: builder.query<PaymentDetails, string>({
      query: (id) => `/payments/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: 'PaymentTransaction', id }],
      transformResponse: (response: unknown) => unwrap<PaymentDetails>(response),
    }),

    getPaymentGateways: builder.query<PaymentGatewaySummary[], void>({
      query: () => '/payments/gateways',
      providesTags: ['PaymentGateway'],
      transformResponse: (response: unknown) => {
        const data = unwrap<PaymentGatewaySummary[]>(response);
        return Array.isArray(data) ? data : [];
      },
    }),

    seedPaymentDemoData: builder.mutation<SeedPaymentDemoDataResponse, void>({
      query: () => ({
        url: '/payments/transactions/seed-demo-data',
        method: 'POST',
      }),
      // A payment change must refresh the table, the KPIs, the overview chart,
      // the top-methods panel and the gateway list — never a page reload.
      invalidatesTags: ['Payment', 'PaymentTransaction', 'PaymentSummary', 'PaymentGateway'],
      transformResponse: (response: unknown) => unwrap<SeedPaymentDemoDataResponse>(response),
    }),

    getOrderBalance: builder.query<OrderBalance, string>({
      query: (orderId) => `/payments/orders/${orderId}/balance`,
      providesTags: (_result, _error, orderId) => [{ type: 'OrderBalance', id: orderId }],
      transformResponse: (response: unknown) => unwrap<OrderBalance>(response),
    }),

    getOrderPaymentHistory: builder.query<OrderPaymentEntry[], string>({
      query: (orderId) => `/payments/orders/${orderId}/history`,
      providesTags: (_result, _error, orderId) => [{ type: 'OrderPaymentHistory', id: orderId }],
      transformResponse: (response: unknown) => {
        const data = unwrap<OrderPaymentEntry[]>(response);
        return Array.isArray(data) ? data : [];
      },
    }),

    recordManualPayment: builder.mutation<OrderPaymentEntry, RecordManualPaymentParams>({
      query: ({ orderId, ...body }) => ({
        url: `/payments/orders/${orderId}/manual-payment`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'OrderBalance', id: orderId },
        { type: 'OrderPaymentHistory', id: orderId },
      ],
      transformResponse: (response: unknown) => unwrap<OrderPaymentEntry>(response),
    }),

    createPaymentLink: builder.mutation<PaymentLinkResult, CreatePaymentLinkParams>({
      query: ({ orderId, ...body }) => ({
        url: `/payments/orders/${orderId}/payment-link`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => unwrap<PaymentLinkResult>(response),
    }),
  }),
});

export const {
  useInitiatePaymentMutation,
  useGetMerchantPaymentsQuery,
  useGetPaymentTransactionsQuery,
  useGetPaymentSummaryQuery,
  useGetPaymentDetailsQuery,
  useGetPaymentGatewaysQuery,
  useSeedPaymentDemoDataMutation,
  useGetOrderBalanceQuery,
  useGetOrderPaymentHistoryQuery,
  useRecordManualPaymentMutation,
  useCreatePaymentLinkMutation,
} = paymentApi;
