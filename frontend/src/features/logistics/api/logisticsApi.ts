import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

export type ShipmentStatus =
  | 'PENDING'
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURNING'
  | 'RETURNED'
  | 'CANCELLED';

export type CodStatus =
  | 'NOT_APPLICABLE'
  | 'PENDING'
  | 'COLLECTED'
  | 'SETTLED'
  | 'RETURNED';

export type CourierProvider = 'STEADFAST' | 'PATHAO' | 'PAPERFLY' | 'REDX';

export type ShipmentDateRangePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | '90d'
  | 'custom';

export interface ShipmentCustomer {
  id?: string;
  name: string;
  phone?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId: string;
  orderNumber: string;
  customer: ShipmentCustomer;
  courierProvider: CourierProvider;
  courierName: string;
  /** Null until a courier accepts the booking. */
  trackingCode: string | null;
  codAmount: number;
  codStatus: CodStatus;
  codStatusLabel: string;
  currency: string;
  status: ShipmentStatus;
  statusLabel: string;
  city: string;
  parcelWeight: number;
  isCancellable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentTimelineEvent {
  id: string;
  status: ShipmentStatus;
  statusLabel: string;
  timestamp: string;
  location?: string;
  description?: string;
}

export interface ShipmentDetails extends Shipment {
  pickupAddress: string;
  deliveryAddress: string;
  parcelType: string;
  parcelDimensions?: string;
  deliveryCharge: number;
  deliveryNote?: string;
  specialInstructions?: string;
  codCollectedAt?: string;
  codSettledAt?: string;
  lastSyncAt?: string;
  timeline: ShipmentTimelineEvent[];
  allowedTransitions: ShipmentStatus[];
}

export interface ShipmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShipmentListResponse {
  data: Shipment[];
  meta: ShipmentPagination;
}

export interface ShipmentKpiMetric {
  count: number;
  amount: number;
  previous: number;
  /** Null when there is no comparable baseline — never render NaN/Infinity. */
  changePercent: number | null;
}

export interface ShipmentOverviewSlice {
  label: string;
  count: number;
  percentage: number;
}

export interface CourierPerformance {
  provider: CourierProvider;
  name: string;
  deliveries: number;
  successRate: number;
}

export interface CodSummary {
  total: number;
  collected: number;
  pendingSettlement: number;
  returned: number;
}

export interface ShipmentSummary {
  totalShipments: ShipmentKpiMetric;
  pending: ShipmentKpiMetric;
  inTransit: ShipmentKpiMetric;
  delivered: ShipmentKpiMetric;
  returned: ShipmentKpiMetric;
  codCollected: ShipmentKpiMetric;
  codPending: ShipmentKpiMetric;
  overview: ShipmentOverviewSlice[];
  overviewTotal: number;
  courierPerformance: CourierPerformance[];
  codSummary: CodSummary;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export interface ShipmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  courierProvider?: CourierProvider;
  status?: ShipmentStatus;
  codStatus?: CodStatus;
  dateRange?: ShipmentDateRangePreset;
  dateFrom?: string;
  dateTo?: string;
  timezone?: string;
  city?: string;
  minAmount?: number;
  maxAmount?: number;
  minWeight?: number;
  maxWeight?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CourierProviderOption {
  code: CourierProvider;
  name: string;
}

export interface CreateShipmentRequest {
  orderId: string;
  courierProvider: CourierProvider;
  pickupAddress?: string;
  deliveryAddress?: string;
  customerPhone?: string;
  parcelWeight?: number;
  parcelType?: string;
  parcelDimensions?: string;
  codAmount?: number;
  deliveryNote?: string;
  specialInstructions?: string;
  /** Makes a retried or double-clicked submit resolve to the same shipment. */
  idempotencyKey?: string;
}

export interface SeedShipmentDemoDataResponse {
  success: boolean;
  message: string;
  ordersCreated: number;
  shipmentsCreated: number;
  eventsCreated: number;
}

export type CourierConnectionStatus = 'Connected' | 'Disconnected' | 'Error';

export type CourierApiHealth = 'Healthy' | 'Fair' | 'Poor' | 'N/A';

/**
 * One credential input the connect form renders. Declared by the backend
 * adapter rather than hardcoded here, so adding a courier with a different auth
 * shape needs no frontend change.
 */
export interface CourierCredentialField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

/**
 * A merchant's connection to one courier. `maskedCredentials` is exactly what
 * the server sends — it never contains a usable secret, and submitting a mask
 * back unchanged is understood by the server as "leave this field alone".
 */
export interface CourierDashboardItem {
  id: string;
  code: CourierProvider;
  name: string;
  type: string;
  status: CourierConnectionStatus;
  apiHealth: CourierApiHealth;
  apiSuccessRate: number;
  shipments: number;
  delivered: number;
  successRate: number;
  codSupport: boolean;
  coverage: string;
  website: string;
  isEnabled: boolean;
  isDefault: boolean;
  sandbox: boolean;
  autoCreateShipment: boolean;
  autoUpdateTracking: boolean;
  supportsCancellation: boolean;
  supportsTracking: boolean;
  lastApiSync: string | null;
  lastWebhook: string | null;
  lastTestedAt: string | null;
  lastTestSucceeded: boolean | null;
  lastTestMessage: string | null;
  hasCredentials: boolean;
  credentialFields: CourierCredentialField[];
  maskedCredentials: Record<string, string>;
}

/** `change` is null when there is no comparable baseline — never render NaN. */
export interface CourierMetric {
  count: number;
  change: number | null;
}

export interface CouriersDashboardResponse {
  summary: {
    totalCouriers: CourierMetric;
    connected: CourierMetric;
    disconnected: CourierMetric;
    active: CourierMetric;
    apiHealth: { rate: number; change: number | null };
  };
  couriers: CourierDashboardItem[];
}

export interface UpsertCourierIntegrationRequest {
  provider: CourierProvider;
  credentials?: Record<string, string>;
  isEnabled?: boolean;
  sandbox?: boolean;
  autoCreateShipment?: boolean;
  autoUpdateTracking?: boolean;
  isDefault?: boolean;
}

export interface CourierConnectionTestResponse {
  success: boolean;
  message: string;
  integration: CourierDashboardItem;
}

export interface SeedCourierDemoDataResponse {
  success: boolean;
  message: string;
  integrationsCreated: number;
  /** Providers left untouched because they were already configured. */
  integrationsSkipped: number;
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
const toQueryParams = (params?: ShipmentFilters): Record<string, string | number> => {
  const result: Record<string, string | number> = {};
  if (!params) return result;
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    result[key] = value as string | number;
  });
  return result;
};

const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/(orders|payments|logistics)$/, '') ||
  'http://localhost:5001/api/v1';

export const logisticsApi = createApi({
  reducerPath: 'logisticsApi',
  baseQuery: createBaseQueryWithReauth(API_ROOT),
  tagTypes: ['Shipment', 'ShipmentSummary', 'CourierProvider', 'CourierIntegration'],
  endpoints: (builder) => ({
    getShipments: builder.query<ShipmentListResponse, ShipmentFilters | void>({
      query: (params) => ({
        url: '/logistics/shipments',
        params: toQueryParams(params || undefined),
      }),
      providesTags: ['Shipment'],
      transformResponse: (response: unknown): ShipmentListResponse => {
        const payload = unwrap<ShipmentListResponse>(response);
        return {
          data: Array.isArray(payload?.data) ? payload.data : [],
          meta: payload?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
      },
    }),

    getShipmentSummary: builder.query<ShipmentSummary, ShipmentFilters | void>({
      query: (params) => ({
        url: '/logistics/shipments/summary',
        params: toQueryParams(params || undefined),
      }),
      providesTags: ['ShipmentSummary'],
      transformResponse: (response: unknown) => unwrap<ShipmentSummary>(response),
    }),

    getShipmentDetails: builder.query<ShipmentDetails, string>({
      query: (id) => `/logistics/shipments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Shipment', id }],
      transformResponse: (response: unknown) => unwrap<ShipmentDetails>(response),
    }),

    getCourierProviders: builder.query<CourierProviderOption[], void>({
      query: () => '/logistics/couriers',
      providesTags: ['CourierProvider'],
      transformResponse: (response: unknown) => {
        const data = unwrap<CourierProviderOption[]>(response);
        return Array.isArray(data) ? data : [];
      },
    }),

    createShipment: builder.mutation<ShipmentDetails, CreateShipmentRequest>({
      query: (body) => ({
        url: '/logistics/shipments',
        method: 'POST',
        body,
      }),
      // A new parcel changes the table, the KPI row, the donut, courier
      // performance and the COD panel — never a page reload.
      invalidatesTags: ['Shipment', 'ShipmentSummary'],
      transformResponse: (response: unknown) => unwrap<ShipmentDetails>(response),
    }),

    cancelShipment: builder.mutation<ShipmentDetails, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/logistics/shipments/${id}/cancel`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        'Shipment',
        'ShipmentSummary',
        { type: 'Shipment', id },
      ],
      transformResponse: (response: unknown) => unwrap<ShipmentDetails>(response),
    }),

    syncShipment: builder.mutation<ShipmentDetails, string>({
      query: (id) => ({
        url: `/logistics/shipments/${id}/sync`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        'Shipment',
        'ShipmentSummary',
        { type: 'Shipment', id },
      ],
      transformResponse: (response: unknown) => unwrap<ShipmentDetails>(response),
    }),

    seedShipmentDemoData: builder.mutation<SeedShipmentDemoDataResponse, void>({
      query: () => ({
        url: '/logistics/shipments/seed-demo-data',
        method: 'POST',
      }),
      invalidatesTags: ['Shipment', 'ShipmentSummary'],
      transformResponse: (response: unknown) => unwrap<SeedShipmentDemoDataResponse>(response),
    }),

    // --- Order-screen entry points (kept so the Orders UI keeps working) ---

    bookCourier: builder.mutation<ShipmentDetails, CreateShipmentRequest>({
      query: (body) => ({
        url: '/logistics/book',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Shipment', 'ShipmentSummary'],
      transformResponse: (response: unknown) => unwrap<ShipmentDetails>(response),
    }),

    syncConsignment: builder.mutation<ShipmentDetails, string>({
      query: (orderId) => ({
        url: `/logistics/consignments/order/${orderId}/sync`,
        method: 'POST',
      }),
      invalidatesTags: ['Shipment', 'ShipmentSummary'],
      transformResponse: (response: unknown) => unwrap<ShipmentDetails>(response),
    }),

    // --- Couriers tab: per-merchant courier integrations ---

    getCouriersDashboard: builder.query<CouriersDashboardResponse, void>({
      query: () => '/logistics/courier-integrations',
      providesTags: ['CourierIntegration'],
      transformResponse: (response: unknown): CouriersDashboardResponse => {
        const payload = unwrap<CouriersDashboardResponse>(response);
        return {
          summary: payload?.summary ?? {
            totalCouriers: { count: 0, change: null },
            connected: { count: 0, change: null },
            disconnected: { count: 0, change: null },
            active: { count: 0, change: null },
            apiHealth: { rate: 0, change: null },
          },
          couriers: Array.isArray(payload?.couriers) ? payload.couriers : [],
        };
      },
    }),

    getCourierIntegration: builder.query<CourierDashboardItem, CourierProvider>({
      query: (provider) => `/logistics/courier-integrations/${provider}`,
      providesTags: (result, error, provider) => [{ type: 'CourierIntegration', id: provider }],
      transformResponse: (response: unknown) => unwrap<CourierDashboardItem>(response),
    }),

    upsertCourierIntegration: builder.mutation<
      CourierDashboardItem,
      UpsertCourierIntegrationRequest
    >({
      query: ({ provider, ...body }) => ({
        url: `/logistics/courier-integrations/${provider}`,
        method: 'PATCH',
        body,
      }),
      // Connecting a courier changes the KPI row, the table and the shipment
      // form's provider list — never a page reload.
      invalidatesTags: (result, error, { provider }) => [
        'CourierIntegration',
        'CourierProvider',
        { type: 'CourierIntegration', id: provider },
      ],
      transformResponse: (response: unknown) => unwrap<CourierDashboardItem>(response),
    }),

    toggleCourierIntegration: builder.mutation<
      CourierDashboardItem,
      { provider: CourierProvider; isEnabled?: boolean }
    >({
      query: ({ provider, isEnabled }) => ({
        url: `/logistics/courier-integrations/${provider}/toggle`,
        method: 'PATCH',
        body: { isEnabled },
      }),
      invalidatesTags: (result, error, { provider }) => [
        'CourierIntegration',
        'CourierProvider',
        { type: 'CourierIntegration', id: provider },
      ],
      transformResponse: (response: unknown) => unwrap<CourierDashboardItem>(response),
    }),

    setDefaultCourier: builder.mutation<CourierDashboardItem, CourierProvider>({
      query: (provider) => ({
        url: `/logistics/courier-integrations/${provider}/default`,
        method: 'PATCH',
      }),
      // Every row's Default badge can change, so the whole list is invalidated.
      invalidatesTags: ['CourierIntegration'],
      transformResponse: (response: unknown) => unwrap<CourierDashboardItem>(response),
    }),

    testCourierConnection: builder.mutation<CourierConnectionTestResponse, CourierProvider>({
      query: (provider) => ({
        url: `/logistics/courier-integrations/${provider}/test`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, provider) => [
        'CourierIntegration',
        { type: 'CourierIntegration', id: provider },
      ],
      // The response interceptor hoists this payload's `message` into the
      // envelope and replaces `success` with its own always-true transport
      // flag, so the real outcome is read back from the integration the server
      // returned — never from the envelope, which would report every failed
      // handshake as a success.
      transformResponse: (response: unknown): CourierConnectionTestResponse => {
        const envelope = (response ?? {}) as {
          message?: string;
          data?: Partial<CourierConnectionTestResponse> | null;
        };
        const body = envelope.data ?? {};
        const integration = body.integration as CourierDashboardItem | undefined;

        return {
          success: integration?.lastTestSucceeded ?? body.success ?? false,
          message:
            integration?.lastTestMessage ??
            body.message ??
            envelope.message ??
            'Connection test finished.',
          integration: integration as CourierDashboardItem,
        };
      },
    }),

    seedCourierDemoData: builder.mutation<SeedCourierDemoDataResponse, void>({
      query: () => ({
        url: '/logistics/courier-integrations/seed-demo-data',
        method: 'POST',
      }),
      invalidatesTags: ['CourierIntegration', 'CourierProvider'],
      // The platform's response interceptor lifts any payload carrying a
      // top-level `message` into the envelope and keeps only its `data`, which
      // is empty here — so the summary is read off the envelope itself rather
      // than from an unwrapped body that would be null.
      transformResponse: (response: unknown): SeedCourierDemoDataResponse => {
        const envelope = (response ?? {}) as {
          message?: string;
          data?: Partial<SeedCourierDemoDataResponse> | null;
        };
        const body = envelope.data ?? {};
        return {
          success: body.success ?? true,
          message: body.message ?? envelope.message ?? 'Courier demo data seeded.',
          integrationsCreated: body.integrationsCreated ?? 0,
          integrationsSkipped: body.integrationsSkipped ?? 0,
        };
      },
    }),
  }),
});

export const {
  useGetShipmentsQuery,
  useGetShipmentSummaryQuery,
  useGetShipmentDetailsQuery,
  useGetCourierProvidersQuery,
  useCreateShipmentMutation,
  useCancelShipmentMutation,
  useSyncShipmentMutation,
  useSeedShipmentDemoDataMutation,
  useBookCourierMutation,
  useSyncConsignmentMutation,
  useGetCouriersDashboardQuery,
  useGetCourierIntegrationQuery,
  useUpsertCourierIntegrationMutation,
  useToggleCourierIntegrationMutation,
  useSetDefaultCourierMutation,
  useTestCourierConnectionMutation,
  useSeedCourierDemoDataMutation,
} = logisticsApi;
