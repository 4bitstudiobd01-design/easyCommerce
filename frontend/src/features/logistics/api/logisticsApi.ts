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

/**
 * Placeholder shape for the future Couriers tab's provider health panel.
 * Sourced from a local mock (see getCouriersDashboard below) — no backend
 * endpoint exists for integration configs yet, so this is kept separate from
 * the real Shipment types above rather than blended into them.
 */
export interface CourierIntegrationConfig {
  apiKey?: string;
  apiSecret?: string;
  storeId?: string;
  sandbox?: boolean;
}

export interface CourierDashboardItem {
  id: string;
  code: CourierProvider;
  name: string;
  type: string;
  status: 'Connected' | 'Disconnected' | 'Error';
  apiHealth: 'Healthy' | 'Fair' | 'Poor' | 'N/A';
  apiSuccessRate30d: number;
  shipments: number;
  delivered: number;
  successRate: number;
  codSupport: boolean;
  coverage: string;
  website: string;
  lastApiSync: string | null;
  lastWebhook: string | null;
  autoCreateShipment: boolean;
  autoUpdateTracking: boolean;
  config?: CourierIntegrationConfig;
}

export interface CouriersDashboardResponse {
  summary: {
    totalCouriers: { count: number; change: number };
    connected: { count: number; change: number };
    disconnected: { count: number; change: number };
    active: { count: number; change: number };
    apiHealth: { rate: number; change: number };
  };
  couriers: CourierDashboardItem[];
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
  tagTypes: ['Shipment', 'ShipmentSummary', 'CourierProvider'],
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

    // --- Couriers tab placeholder (out of the Shipments release's scope) ---

    getCouriersDashboard: builder.query<CouriersDashboardResponse, void>({
      // MOCK endpoint — no backend exists yet for courier integration configs.
      // Kept isolated behind its own types so it never contaminates the real
      // Shipment contract above.
      queryFn: async () => ({
        data: {
          summary: {
            totalCouriers: { count: 4, change: 1 },
            connected: { count: 3, change: 50 },
            disconnected: { count: 1, change: -50 },
            active: { count: 3, change: 25 },
            apiHealth: { rate: 98.6, change: 2.4 },
          },
          couriers: [
            {
              id: '1',
              code: 'STEADFAST',
              name: 'Steadfast',
              type: 'Courier Service',
              status: 'Connected',
              apiHealth: 'Healthy',
              apiSuccessRate30d: 92.4,
              shipments: 624,
              delivered: 456,
              successRate: 92.4,
              codSupport: true,
              coverage: 'All Over Bangladesh',
              website: 'www.steadfast.com.bd',
              lastApiSync: '2025-08-14T10:45:00Z',
              lastWebhook: '2025-08-14T10:42:00Z',
              autoCreateShipment: true,
              autoUpdateTracking: true,
            },
            {
              id: '2',
              code: 'PATHAO',
              name: 'Pathao Courier',
              type: 'Courier Service',
              status: 'Connected',
              apiHealth: 'Healthy',
              apiSuccessRate30d: 88.7,
              shipments: 456,
              delivered: 389,
              successRate: 88.7,
              codSupport: true,
              coverage: 'All Over Bangladesh',
              website: 'pathao.com',
              lastApiSync: '2025-08-14T10:30:00Z',
              lastWebhook: null,
              autoCreateShipment: false,
              autoUpdateTracking: true,
            },
            {
              id: '3',
              code: 'REDX',
              name: 'RedX',
              type: 'Courier Service',
              status: 'Connected',
              apiHealth: 'Fair',
              apiSuccessRate30d: 78.5,
              shipments: 102,
              delivered: 80,
              successRate: 78.5,
              codSupport: true,
              coverage: 'All Over Bangladesh',
              website: 'redx.com.bd',
              lastApiSync: '2025-08-14T09:20:00Z',
              lastWebhook: null,
              autoCreateShipment: false,
              autoUpdateTracking: false,
            },
            {
              id: '4',
              code: 'PAPERFLY',
              name: 'Paperfly',
              type: 'Logistics Service',
              status: 'Disconnected',
              apiHealth: 'N/A',
              apiSuccessRate30d: 0,
              shipments: 0,
              delivered: 0,
              successRate: 0,
              codSupport: true,
              coverage: 'All Over Bangladesh',
              website: 'paperfly.com.bd',
              lastApiSync: null,
              lastWebhook: null,
              autoCreateShipment: false,
              autoUpdateTracking: false,
            },
          ],
        },
      }),
      providesTags: ['CourierProvider'],
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
} = logisticsApi;
