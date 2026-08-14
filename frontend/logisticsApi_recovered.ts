import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

export interface Consignment {
  id: string;
  trackingCode: string;
  orderId: string;
  orderNumber: string;
  courierProvider: 'STEADFAST' | 'PATHAO' | 'PAPERFLY';
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  codAmount: number;
  deliveryCharge: number;
  status: 'BOOKED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_FAILED' | 'RETURNED' | 'CANCELLED';
  tenantId: string;
  createdAt: string;
  order?: {
    paymentStatus: string;
    customerName: string;
  };
}

export interface ConsignmentsResponse {
  items: Consignment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalShipments: number;
    totalShipmentsChange: number;
    pending: number;
    pendingChange: number;
    inTransit: number;
    inTransitChange: number;
    delivered: number;
    deliveredChange: number;
    returned: number;
    returnedChange: number;
    codCollected: number;
    codCollectedChange: number;
    codPending: number;
    codPendingChange: number;
  };
}

export interface GetConsignmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  courierProvider?: string;
  status?: string;
  codStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CourierPerformance {
  provider: string;
  deliveries: number;
  successRate: number;
}

export interface LogisticsAnalyticsResponse {
  overview: {
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
    returned: number;
    failed: number;
  };
  courierPerformance: CourierPerformance[];
  codSummary: {
    total: number;
    collected: number;
    pendingSettlement: number;
    returned: number;
  };
}

export interface CreateCourierBookingRequest {
  orderId: string;
  courierProvider: 'STEADFAST' | 'PATHAO' | 'PAPERFLY';
  note?: string;
}

export const logisticsApi = createApi({
  reducerPath: 'logisticsApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/logistics'),
  tagTypes: ['Consignment', 'LogisticsAnalytics'],
  endpoints: (builder) => ({
    bookCourier: builder.mutation<Consignment, CreateCourierBookingRequest>({
      query: (body) => ({
        url: '/book',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Consignment', 'LogisticsAnalytics'],
      transformResponse: (response: { data: Consignment }) => response.data,
    }),
    getMerchantConsignments: builder.query<ConsignmentsResponse, GetConsignmentsParams | void>({
      query: (params) => ({
        url: '/consignments',
        params: params || {},
      }),
      providesTags: ['Consignment'],
      transformResponse: (response: { data: ConsignmentsResponse }) => response.data,
    }),
    getLogisticsAnalytics: builder.query<LogisticsAnalyticsResponse, void>({
      query: () => '/analytics/overview',
      providesTags: ['LogisticsAnalytics'],
      transformResponse: (response: { data: LogisticsAnalyticsResponse }) => response.data,
    }),
    syncConsignment: builder.mutation<Consignment, string>({
      query: (orderId) => ({
        url: `/consignments/order/${orderId}/sync`,
        method: 'POST',
      }),
      invalidatesTags: ['Consignment', 'LogisticsAnalytics'],
      transformResponse: (response: { data: Consignment }) => response.data,
    }),
  }),
});

export const { 
  useBookCourierMutation, 
  useGetMerchantConsignmentsQuery, 
  useGetLogisticsAnalyticsQuery,
  useSyncConsignmentMutation 
} = logisticsApi;
