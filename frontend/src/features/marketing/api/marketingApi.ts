import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/(orders|payments|logistics)$/, '') ||
  'http://localhost:5001/api/v1';

const unwrap = <T>(response: any): T => {
  if (response && response.data !== undefined) return response.data as T;
  return response as T;
};

export interface MarketingKpi {
  count: number | string;
  total?: number;
  subtext?: string;
  changeText?: string;
  changeDirection?: 'up' | 'down';
}

export interface ConnectedIntegration {
  id: string;
  provider: 'META' | 'GOOGLE_ANALYTICS' | 'GOOGLE_ADS' | 'TIKTOK';
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  description?: string;
  pixelId?: string;
  eventsToday?: number;
  lastEventAt?: string;
}

export interface TrackingEvent {
  id: string;
  eventName: string;
  description: string;
  isActive: boolean;
  eventsToday: number;
  lastTriggeredAt: string;
  successRate: number;
}

export interface MarketingDashboardResponse {
  kpis: {
    connectedPixels: MarketingKpi;
    activePixels: MarketingKpi;
    eventsToday: MarketingKpi;
    eventsFailed: MarketingKpi;
    successRate: MarketingKpi;
  };
  integrations: ConnectedIntegration[];
  trackingEvents: TrackingEvent[];
}

export interface EventLogItem {
  id: string;
  eventName: string;
  source: string;
  orderRef: string;
  status: 'SENT' | 'FAILED';
  createdAt: string;
}

export interface EventLogsResponse {
  data: EventLogItem[];
  total: number;
}

export const marketingApi = createApi({
  reducerPath: 'marketingApi',
  baseQuery: createBaseQueryWithReauth(API_ROOT),
  tagTypes: ['MarketingDashboard', 'MarketingLogs'],
  endpoints: (builder) => ({
    getMarketingDashboard: builder.query<MarketingDashboardResponse, void>({
      query: () => '/marketing/dashboard',
      providesTags: ['MarketingDashboard'],
      transformResponse: (response: unknown) => unwrap<MarketingDashboardResponse>(response),
    }),
    getMarketingLogs: builder.query<EventLogsResponse, { limit?: number; offset?: number }>({
      query: (params) => ({
        url: '/marketing/logs',
        params,
      }),
      providesTags: ['MarketingLogs'],
      transformResponse: (response: unknown) => unwrap<EventLogsResponse>(response),
    }),
    toggleEvent: builder.mutation<void, { eventName: string; isActive: boolean }>({
      query: ({ eventName, isActive }) => ({
        url: `/marketing/events/${eventName}`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['MarketingDashboard'],
    }),
    connectPixel: builder.mutation<void, { provider: string; pixelId: string }>({
      query: (body) => ({
        url: `/marketing/pixels/${body.provider}/connect`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MarketingDashboard'],
    }),
  }),
});

export const {
  useGetMarketingDashboardQuery,
  useGetMarketingLogsQuery,
  useToggleEventMutation,
  useConnectPixelMutation,
} = marketingApi;
