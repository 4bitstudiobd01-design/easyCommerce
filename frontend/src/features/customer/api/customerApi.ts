import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export type CustomerStatusType = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CustomerSourceType = 'ONLINE_STORE' | 'MANUAL' | 'POS' | 'IMPORT';

export interface Customer {
  id: string;
  tenantId: string;
  storeId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  status: CustomerStatusType;
  source: CustomerSourceType;
  createdAt: string;
  updatedAt: string;
  ordersCount?: number;
  totalSpent?: number;
  lastOrderAt?: string | null;
  hasAccount?: boolean;
  /** Marketing channel captured at registration — 'social', 'paid_search', 'direct', etc. Unset for guest-only (never-registered) customers. */
  registrationChannel?: string;
  /** Exact platform, e.g. 'facebook', 'tiktok', 'instagram' — only present when the registration URL carried a utm_source param. */
  registrationUtmSource?: string;
  registrationUtmMedium?: string;
  registrationUtmCampaign?: string;
  registrationReferrerHost?: string;
}

export interface CustomerDetail extends Customer {
  location?: string | null;
  stats: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderAt: string | null;
  };
}

export interface CustomerAddress {
  id: string;
  tenantId: string;
  storeId?: string;
  customerId: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  area?: string;
  thana?: string;
  district?: string;
  division?: string;
  city: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderItem {
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
  customerName: string;
  customerPhone: string;
  courierProvider?: string;
  consignmentStatus?: string;
  trackingCode?: string;
}

export interface CustomerNote {
  id: string;
  tenantId: string;
  storeId?: string;
  customerId: string;
  authorId?: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerActivity {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  actorName: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface CustomerOrdersQueryParams {
  customerId: string;
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface CustomerKpis {
  totalCustomers: number;
  newCustomers: number;
  avgOrdersPerCustomer: number;
  totalSpent: number;
}

export interface CustomerAnalyticsOverview {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  repeatCustomers: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgCustomerLtv: number;
}

export interface CustomerSourceDistributionItem {
  source: string;
  count: number;
  percentage: number;
}

export interface CustomerTrendPoint {
  date: string;
  newCustomers: number;
  revenue: number;
}

export interface TopCustomerItem {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderAt: string | null;
}

export interface SegmentRuleCondition {
  field: 'ordersCount' | 'totalSpent' | 'status' | 'source' | 'origin' | 'daysSinceLastOrder';
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: any;
}

export interface SegmentRuleGroup {
  matchType: 'ALL' | 'ANY';
  conditions: SegmentRuleCondition[];
}

export interface FraudCourierSummary {
  logo?: string;
  data_type?: 'rating' | 'delivery';
  customer_rating?: string;
  risk_level?: string;
  message?: string;
  total: number;
  success: number;
  cancel: number;
}

export interface FraudCheckResult {
  phone: string;
  summaries: Record<string, FraudCourierSummary>;
  totalOrders: number;
  successOrders: number;
  cancelOrders: number;
  successRate: number;
  cancelRate: number;
  checkedAt: string;
  cached: boolean;
}

export interface CustomerSegment {
  id: string;
  tenantId: string;
  storeId?: string;
  name: string;
  description?: string;
  rules: SegmentRuleGroup;
  isActive: boolean;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerSegmentRequest {
  name: string;
  description?: string;
  rules: SegmentRuleGroup;
  isActive?: boolean;
}

export type UpdateCustomerSegmentRequest = Partial<CreateCustomerSegmentRequest>;

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  status?: CustomerStatusType;
  source?: CustomerSourceType;
  origin?: string;
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: CustomerStatusType;
  source?: CustomerSourceType;
  origin?: string;
}

export interface ImportCustomerRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  source?: CustomerSourceType;
  status?: CustomerStatusType;
}

export interface ImportCustomersResponse {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface CreateCustomerAddressRequest {
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  area?: string;
  thana?: string;
  district?: string;
  division?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export type UpdateCustomerAddressRequest = Partial<CreateCustomerAddressRequest>;

export interface CustomerListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  origin?: string;
  segmentId?: string;
  dateRange?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/customers'),
  tagTypes: ['Customer', 'CustomerKpi', 'CustomerAddress', 'CustomerOrders', 'CustomerNote', 'CustomerActivity', 'CustomerAnalytics', 'CustomerSegment'],
  endpoints: (builder) => ({
    getCustomers: builder.query<{ data: Customer[]; meta: any }, CustomerListQueryParams | void>({
      query: (params) => ({
        url: '',
        params: params || {},
      }),
      providesTags: ['Customer'],
      transformResponse: (response: any) => {
        const payload = response?.data ?? response;
        const data = Array.isArray(payload) ? payload : payload?.data;
        return {
          data: Array.isArray(data) ? data : [],
          meta: payload?.meta ?? response?.meta ?? null,
        };
      },
    }),
    getCustomerKpis: builder.query<CustomerKpis, void>({
      query: () => '/kpi',
      providesTags: ['CustomerKpi', 'Customer'],
      transformResponse: (response: { data: CustomerKpis }) => response.data || response,
    }),
    getCustomerById: builder.query<CustomerDetail, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
      transformResponse: (response: { data: CustomerDetail }) => response.data || response,
    }),
    getFraudCheckForCustomer: builder.query<FraudCheckResult, { customerId: string; refresh?: boolean }>({
      query: ({ customerId, refresh }) => ({
        url: `/${customerId}/fraud-check`,
        params: refresh ? { refresh: 'true' } : undefined,
      }),
      transformResponse: (response: { data: FraudCheckResult }) => response.data || response,
    }),
    getFraudCheckByPhone: builder.query<FraudCheckResult, { phone: string; refresh?: boolean }>({
      query: ({ phone, refresh }) => ({
        url: `/fraud-check/by-phone`,
        params: refresh ? { phone, refresh: 'true' } : { phone },
      }),
      transformResponse: (response: { data: FraudCheckResult }) => response.data || response,
    }),
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer', 'CustomerKpi', 'CustomerAnalytics', 'CustomerSegment'],
      transformResponse: (response: { data: Customer }) => response.data || response,
    }),
    updateCustomer: builder.mutation<Customer, { id: string; data: UpdateCustomerRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, 'Customer', 'CustomerKpi', 'CustomerAnalytics', 'CustomerSegment'],
      transformResponse: (response: { data: Customer }) => response.data || response,
    }),
    updateCustomerStatus: builder.mutation<Customer, { id: string; status: CustomerStatusType }>({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, 'Customer', 'CustomerKpi', 'CustomerAnalytics', 'CustomerSegment', { type: 'CustomerActivity', id: `ACT-${id}` }],
      transformResponse: (response: { data: Customer }) => response.data || response,
    }),
    bulkUpdateCustomerStatus: builder.mutation<{ affected: number; status: CustomerStatusType }, { customerIds: string[]; status: CustomerStatusType }>({
      query: (body) => ({
        url: '/bulk/status',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer', 'CustomerKpi', 'CustomerActivity', 'CustomerAnalytics', 'CustomerSegment'],
    }),
    importCustomers: builder.mutation<ImportCustomersResponse, { customers: ImportCustomerRow[]; overwrite?: boolean }>({
      query: (body) => ({
        url: '/import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer', 'CustomerKpi', 'CustomerAnalytics', 'CustomerSegment'],
    }),

    // --- ANALYTICS ENDPOINTS ---
    getCustomerAnalyticsOverview: builder.query<CustomerAnalyticsOverview, { dateRange?: string; dateFrom?: string; dateTo?: string; source?: string; status?: string } | void>({
      query: (params) => ({
        url: '/analytics/overview',
        params: params || {},
      }),
      providesTags: ['CustomerAnalytics', 'Customer'],
      transformResponse: (response: { data: CustomerAnalyticsOverview } | CustomerAnalyticsOverview) => (response as any).data || response,
    }),
    getCustomerAnalyticsSources: builder.query<CustomerSourceDistributionItem[], void>({
      query: () => '/analytics/sources',
      providesTags: ['CustomerAnalytics', 'Customer'],
      transformResponse: (response: { data: CustomerSourceDistributionItem[] } | CustomerSourceDistributionItem[]) => {
        const data = (response as any)?.data ?? response;
        return Array.isArray(data) ? data : [];
      },
    }),
    getCustomerAnalyticsTrend: builder.query<CustomerTrendPoint[], { dateRange?: string; dateFrom?: string; dateTo?: string } | void>({
      query: (params) => ({
        url: '/analytics/trend',
        params: params || {},
      }),
      providesTags: ['CustomerAnalytics', 'Customer'],
      transformResponse: (response: { data: CustomerTrendPoint[] } | CustomerTrendPoint[]) => {
        const data = (response as any)?.data ?? response;
        return Array.isArray(data) ? data : [];
      },
    }),
    getTopCustomers: builder.query<TopCustomerItem[], number | void>({
      query: (limit = 10) => `/analytics/top?limit=${limit}`,
      providesTags: ['CustomerAnalytics', 'Customer'],
      transformResponse: (response: { data: TopCustomerItem[] } | TopCustomerItem[]) => {
        const data = (response as any)?.data ?? response;
        return Array.isArray(data) ? data : [];
      },
    }),

    // --- SEGMENT ENDPOINTS ---
    getCustomerSegments: builder.query<CustomerSegment[], void>({
      query: () => '/segments',
      providesTags: ['CustomerSegment', 'Customer'],
      transformResponse: (response: { data: CustomerSegment[] } | CustomerSegment[]) => {
        const data = (response as any)?.data ?? response;
        return Array.isArray(data) ? data : [];
      },
    }),
    createCustomerSegment: builder.mutation<CustomerSegment, CreateCustomerSegmentRequest>({
      query: (body) => ({
        url: '/segments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomerSegment'],
      transformResponse: (response: { data: CustomerSegment }) => response.data || response,
    }),
    updateCustomerSegment: builder.mutation<CustomerSegment, { id: string; data: UpdateCustomerSegmentRequest }>({
      query: ({ id, data }) => ({
        url: `/segments/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['CustomerSegment'],
      transformResponse: (response: { data: CustomerSegment }) => response.data || response,
    }),
    deleteCustomerSegment: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/segments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CustomerSegment'],
    }),
    previewCustomerSegment: builder.mutation<{ customerCount: number }, SegmentRuleGroup>({
      query: (body) => ({
        url: '/segments/preview',
        method: 'POST',
        body,
      }),
    }),

    // --- ADDRESS ENDPOINTS ---
    getCustomerAddresses: builder.query<CustomerAddress[], string>({
      query: (customerId) => `/${customerId}/addresses`,
      providesTags: (result, error, customerId) => [
        { type: 'CustomerAddress', id: `LIST-${customerId}` },
      ],
      transformResponse: (response: { data: CustomerAddress[] } | CustomerAddress[]) => {
        const data = (response as any)?.data ?? response;
        return Array.isArray(data) ? data : [];
      },
    }),
    createCustomerAddress: builder.mutation<CustomerAddress, { customerId: string; data: CreateCustomerAddressRequest }>({
      query: ({ customerId, data }) => ({
        url: `/${customerId}/addresses`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'CustomerAddress', id: `LIST-${customerId}` },
        { type: 'Customer', id: customerId },
        { type: 'CustomerActivity', id: `ACT-${customerId}` },
      ],
      transformResponse: (response: { data: CustomerAddress }) => response.data || response,
    }),
    updateCustomerAddress: builder.mutation<CustomerAddress, { customerId: string; addressId: string; data: UpdateCustomerAddressRequest }>({
      query: ({ customerId, addressId, data }) => ({
        url: `/${customerId}/addresses/${addressId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'CustomerAddress', id: `LIST-${customerId}` },
        { type: 'Customer', id: customerId },
        { type: 'CustomerActivity', id: `ACT-${customerId}` },
      ],
      transformResponse: (response: { data: CustomerAddress }) => response.data || response,
    }),
    setDefaultCustomerAddress: builder.mutation<CustomerAddress, { customerId: string; addressId: string }>({
      query: ({ customerId, addressId }) => ({
        url: `/${customerId}/addresses/${addressId}/default`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'CustomerAddress', id: `LIST-${customerId}` },
        { type: 'Customer', id: customerId },
      ],
      transformResponse: (response: { data: CustomerAddress }) => response.data || response,
    }),
    deleteCustomerAddress: builder.mutation<{ success: boolean }, { customerId: string; addressId: string }>({
      query: ({ customerId, addressId }) => ({
        url: `/${customerId}/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'CustomerAddress', id: `LIST-${customerId}` },
        { type: 'Customer', id: customerId },
      ],
    }),

    // --- ORDER HISTORY ENDPOINT ---
    getCustomerOrders: builder.query<{ data: CustomerOrderItem[]; meta: any }, CustomerOrdersQueryParams>({
      query: ({ customerId, page = 1, limit = 10, status, search }) => ({
        url: `/${customerId}/orders`,
        params: {
          page,
          limit,
          status: status || undefined,
          search: search || undefined,
        },
      }),
      providesTags: (result, error, { customerId }) => [
        { type: 'CustomerOrders', id: `ORDERS-${customerId}` },
      ],
      transformResponse: (response: any) => {
        const payload = response?.data ?? response;
        const data = Array.isArray(payload) ? payload : payload?.data;
        return {
          data: Array.isArray(data) ? data : [],
          meta: payload?.meta ?? response?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
      },
    }),

    // --- NOTES ENDPOINTS ---
    getCustomerNotes: builder.query<CustomerNote[], string>({
      query: (customerId) => `/${customerId}/notes`,
      providesTags: (result, error, customerId) => [
        { type: 'CustomerNote', id: `NOTES-${customerId}` },
      ],
      transformResponse: (response: { data: CustomerNote[] } | CustomerNote[]) => {
        const data = (response as any)?.data ?? response;
        return Array.isArray(data) ? data : [];
      },
    }),
    createCustomerNote: builder.mutation<CustomerNote, { customerId: string; content: string }>({
      query: ({ customerId, content }) => ({
        url: `/${customerId}/notes`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'CustomerNote', id: `NOTES-${customerId}` },
        { type: 'CustomerActivity', id: `ACT-${customerId}` },
      ],
      transformResponse: (response: { data: CustomerNote }) => response.data || response,
    }),
    deleteCustomerNote: builder.mutation<{ success: boolean }, { customerId: string; noteId: string }>({
      query: ({ customerId, noteId }) => ({
        url: `/${customerId}/notes/${noteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'CustomerNote', id: `NOTES-${customerId}` },
        { type: 'CustomerActivity', id: `ACT-${customerId}` },
      ],
    }),

    // --- ACTIVITIES ENDPOINT ---
    getCustomerActivities: builder.query<CustomerActivity[], string>({
      query: (customerId) => `/${customerId}/activities`,
      providesTags: (result, error, customerId) => [
        { type: 'CustomerActivity', id: `ACT-${customerId}` },
      ],
      transformResponse: (response: { data: CustomerActivity[] } | CustomerActivity[]) => {
        const data = (response as any)?.data ?? response;
        return Array.isArray(data) ? data : [];
      },
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerKpisQuery,
  useGetCustomerByIdQuery,
  useLazyGetFraudCheckForCustomerQuery,
  useLazyGetFraudCheckByPhoneQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useUpdateCustomerStatusMutation,
  useBulkUpdateCustomerStatusMutation,
  useImportCustomersMutation,
  useGetCustomerAnalyticsOverviewQuery,
  useGetCustomerAnalyticsSourcesQuery,
  useGetCustomerAnalyticsTrendQuery,
  useGetTopCustomersQuery,
  useGetCustomerSegmentsQuery,
  useCreateCustomerSegmentMutation,
  useUpdateCustomerSegmentMutation,
  useDeleteCustomerSegmentMutation,
  usePreviewCustomerSegmentMutation,
  useGetCustomerAddressesQuery,
  useCreateCustomerAddressMutation,
  useUpdateCustomerAddressMutation,
  useSetDefaultCustomerAddressMutation,
  useDeleteCustomerAddressMutation,
  useGetCustomerOrdersQuery,
  useGetCustomerNotesQuery,
  useCreateCustomerNoteMutation,
  useDeleteCustomerNoteMutation,
  useGetCustomerActivitiesQuery,
} = customerApi;
