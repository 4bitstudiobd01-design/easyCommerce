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

export interface MarketingDashboardResponse {
  kpis: {
    connectedPixels: MarketingKpi;
    activePixels: MarketingKpi;
    eventsToday: MarketingKpi;
    eventsFailed: MarketingKpi;
    successRate: MarketingKpi;
  };
  integrations: ConnectedIntegration[];
}

export const marketingApi = createApi({
  reducerPath: 'marketingApi',
  baseQuery: createBaseQueryWithReauth(API_ROOT),
  tagTypes: ['MarketingDashboard'],
  endpoints: (builder) => ({
    getMarketingDashboard: builder.query<MarketingDashboardResponse, void>({
      query: () => '/marketing/dashboard',
      providesTags: ['MarketingDashboard'],
      transformResponse: (response: unknown) => unwrap<MarketingDashboardResponse>(response),
    }),

    connectPixel: builder.mutation<
      { message: string; data?: any },
      { provider: string; pixelId: string; accessToken?: string; testEventCode?: string }
    >({
      query: (body) => ({
        url: '/marketing/pixels/connect',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MarketingDashboard'],
    }),

    disconnectPixel: builder.mutation<{ message: string }, string>({
      query: (provider) => ({
        url: `/marketing/pixels/${provider}/disconnect`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MarketingDashboard'],
    }),
  }),
});

export const {
  useGetMarketingDashboardQuery,
  useConnectPixelMutation,
  useDisconnectPixelMutation,
} = marketingApi;
