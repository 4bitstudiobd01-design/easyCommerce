import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

// Utility for unwrapping response from backend standard { data, meta } structures
const unwrap = <T>(response: any): T => {
  if (response && response.data !== undefined) return response.data as T;
  return response as T;
};

export type CourierProvider = 'STEADFAST' | 'PATHAO' | 'PAPERFLY' | 'REDX' | string;
export type ShipmentStatus = 'PENDING' | 'BOOKED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_FAILED' | 'RETURNED' | 'CANCELLED' | string;
export type CodStatus = 'COD_PENDING' | 'COD_COLLECTED' | 'PAID' | 'SETTLED' | string;
export type ShipmentDateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom' | string;

export interface Shipment {
  id: string;
  trackingCode: string;
  orderId: string;
  orderNumber: string;
  shipmentNumber: string;
  courierProvider: CourierProvider;
  courierName: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  city: string;
  codAmount: number;
  deliveryCharge: number;
  status: ShipmentStatus;
  statusLabel: string;
  codStatus: string;
  codStatusLabel: string;
  currency: string;
  isCancellable: boolean;
  createdAt: any;
  updatedAt?: any;
  order?: {
    paymentStatus: string;
    customerName: string;
  };
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
  overviewTotal: number;
  totalShipments: ShipmentKpiMetric;
  pending: ShipmentKpiMetric;
  inTransit: ShipmentKpiMetric;
  delivered: ShipmentKpiMetric;
  returned: ShipmentKpiMetric;
  codCollected: ShipmentKpiMetric;
  codPending: ShipmentKpiMetric;
  currency: string;
  overview: ShipmentOverviewSlice[];
  courierPerformance: CourierPerformance[];
  codSummary: CodSummary;
}

export interface ShipmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  courierProvider?: string;
  status?: string;
  codStatus?: string;
  dateRange?: string;
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  minAmount?: number;
  maxAmount?: number;
  minWeight?: number;
  maxWeight?: number;
  timezone?: string;
}

export interface ShipmentDetails extends Shipment {
  timeline: any[];
  parcelWeight: number;
  parcelType: string;
  parcelDimensions: string;
  codCollectedAt: string;
  codSettledAt: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryNote?: string;
  specialInstructions?: string;
  lastSyncAt: string;
}

export interface CourierProviderOption {
  code: string;
  name: string;
}

export interface CreateShipmentRequest {
  orderId: string;
  courierProvider: CourierProvider;
  deliveryNote?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  customerPhone?: string;
  parcelWeight?: number;
  parcelType?: string;
  parcelDimensions?: string;
}

export interface SeedShipmentDemoDataResponse {
  message: string;
  shipmentsCreated: number;
  ordersCreated: number;
}

const toQueryParams = (params?: ShipmentFilters): Record<string, string | number> => {
  const result: Record<string, string | number> = {};
  if (!params) return result;
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    result[key] = value as string | number;
  });
  return result;
};

export interface CourierIntegrationConfig {
  apiKey?: string;
  apiSecret?: string;
  storeId?: string;
  sandbox?: boolean;
}

export interface CourierDashboardItem {
  id: string;
  code: string;
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
      transformResponse: (response: unknown) => unwrap<CourierProviderOption[]>(response),
    }),

    createShipment: builder.mutation<ShipmentDetails, CreateShipmentRequest>({
      query: (body) => ({
        url: '/logistics/shipments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Shipment', 'ShipmentSummary'],
      transformResponse: (response: unknown) => unwrap<ShipmentDetails>(response),
    }),

    cancelShipment: builder.mutation<ShipmentDetails, any>({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        return {
          url: `/logistics/shipments/${id}/cancel`,
          method: 'PATCH',
        };
      },
      invalidatesTags: ['Shipment', 'ShipmentSummary'],
      transformResponse: (response: unknown) => unwrap<ShipmentDetails>(response),
    }),

    syncShipment: builder.mutation<ShipmentDetails, any>({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        return {
          url: `/logistics/shipments/${id}/sync`,
          method: 'POST',
        };
      },
      invalidatesTags: ['Shipment', 'ShipmentSummary'],
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

    getCouriersDashboard: builder.query<CouriersDashboardResponse, void>({
      // MOCK endpoint, since no backend exists for integration configs yet
      queryFn: async () => {
        return {
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
            ]
          }
        };
      },
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
