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

export interface MarketingDashboardResponse {
  kpis: {
    connectedPixels: MarketingKpi;
    activePixels: MarketingKpi;
    eventsToday: MarketingKpi;
    eventsFailed: MarketingKpi;
    successRate: MarketingKpi;
  };
  /** Legacy provider-summary list — still returned by the backend, no longer rendered. */
  integrations: unknown[];
}

// --- Sales-by-Source report + ad spend (Phase A) ---

export type SourceSalesGroupBy = 'channel' | 'source' | 'campaign';
export type AdSpendDimension = 'CHANNEL' | 'SOURCE' | 'CAMPAIGN';

export interface SourceSalesRow {
  dimension: SourceSalesGroupBy;
  dimensionValue: string;
  sessions: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  spend: number;
  currency: string | null;
  roas: number | null;
  cpa: number | null;
}

export interface PixelDeliveryHealth {
  pixelId: string;
  provider: string;
  label: string | null;
  purchaseSent: number;
  purchaseFailed: number;
}

export interface SourceSalesReport {
  rows: SourceSalesRow[];
  deliveryHealth: PixelDeliveryHealth[];
}

export interface MarketingLogRow {
  id: string;
  pixelId: string | null;
  pixelLabel: string | null;
  provider: string | null;
  eventName: string;
  transport: 'BROWSER' | 'SERVER';
  source: string;
  status: 'SENT' | 'FAILED';
  httpStatus: number | null;
  errorMessage: string | null;
  orderRef: string | null;
  utmSource: string | null;
  createdAt: string;
}

export interface MarketingLogsResponse {
  data: MarketingLogRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface MarketingLogsQuery {
  page?: number;
  limit?: number;
  pixelId?: string;
  provider?: string;
  eventName?: string;
  transport?: 'BROWSER' | 'SERVER';
  status?: 'SENT' | 'FAILED';
  dateFrom?: string;
  dateTo?: string;
}

export interface AdSpendEntry {
  id: string;
  dimension: AdSpendDimension;
  dimensionValue: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertAdSpendBody {
  id?: string;
  dimension: AdSpendDimension;
  dimensionValue: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency?: string;
  note?: string;
}

const GROUP_BY_TO_DIMENSION: Record<SourceSalesGroupBy, AdSpendDimension> = {
  channel: 'CHANNEL',
  source: 'SOURCE',
  campaign: 'CAMPAIGN',
};

export const dimensionForGroupBy = (g: SourceSalesGroupBy): AdSpendDimension =>
  GROUP_BY_TO_DIMENSION[g];

// --- Multi-instance pixels (Phase 1) ---

export type PixelProvider = 'META' | 'GOOGLE_ANALYTICS' | 'GOOGLE_ADS' | 'TIKTOK';
export type PixelPageScopeMode = 'ALL' | 'RULES';
export type PixelStatus = 'CONNECTED' | 'DISCONNECTED';

export interface PixelPageRule {
  id: string;
  matchType: 'PAGE_TYPE' | 'URL_PATTERN';
  pageType: string | null;
  urlPattern: string | null;
  include: boolean;
}

export interface MarketingPixelInstance {
  id: string;
  provider: PixelProvider;
  label: string | null;
  pixelId: string;
  hasCredentials: boolean;
  credentialFields: string[];
  capiEnabled: boolean;
  pageScopeMode: PixelPageScopeMode;
  status: PixelStatus;
  isActive: boolean;
  lastEventAt: string | null;
  pageRules: PixelPageRule[];
  createdAt: string;
  updatedAt: string;
}

export interface PixelCredentialsInput {
  accessToken?: string | null;
  apiSecret?: string | null;
  testEventCode?: string | null;
  developerToken?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  refreshToken?: string | null;
}

export interface CreatePixelBody {
  provider: PixelProvider;
  label: string;
  pixelId: string;
  credentials?: PixelCredentialsInput;
  capiEnabled?: boolean;
  pageScopeMode?: PixelPageScopeMode;
  isActive?: boolean;
}

export interface UpdatePixelBody {
  label?: string;
  pixelId?: string;
  credentials?: PixelCredentialsInput | null;
  capiEnabled?: boolean;
  pageScopeMode?: PixelPageScopeMode;
  isActive?: boolean;
  status?: PixelStatus;
}

export interface PageRuleInput {
  matchType: 'PAGE_TYPE' | 'URL_PATTERN';
  pageType?: string;
  urlPattern?: string;
  include?: boolean;
}

export const PROVIDER_META: Record<
  PixelProvider,
  { name: string; idLabel: string; idPlaceholder: string; credFields: { key: keyof PixelCredentialsInput; label: string; placeholder: string }[] }
> = {
  META: {
    name: 'Meta Pixel',
    idLabel: 'Pixel Dataset ID',
    idPlaceholder: 'e.g. 849204928123456',
    credFields: [
      { key: 'accessToken', label: 'Conversions API Access Token', placeholder: 'EAAB...' },
      { key: 'testEventCode', label: 'Test Event Code (optional)', placeholder: 'TEST12345' },
    ],
  },
  GOOGLE_ANALYTICS: {
    name: 'Google Analytics 4',
    idLabel: 'Measurement ID',
    idPlaceholder: 'e.g. G-XXXXXXX',
    credFields: [
      { key: 'apiSecret', label: 'Measurement Protocol API Secret', placeholder: 'xxxxxxxx' },
    ],
  },
  GOOGLE_ADS: {
    name: 'Google Ads',
    idLabel: 'Conversion ID',
    idPlaceholder: 'e.g. AW-123456789',
    credFields: [
      { key: 'developerToken', label: 'Developer Token', placeholder: '' },
      { key: 'clientId', label: 'OAuth Client ID', placeholder: '' },
      { key: 'clientSecret', label: 'OAuth Client Secret', placeholder: '' },
      { key: 'refreshToken', label: 'OAuth Refresh Token', placeholder: '' },
    ],
  },
  TIKTOK: {
    name: 'TikTok Pixel',
    idLabel: 'Pixel ID',
    idPlaceholder: 'e.g. C1234567890ABCDEF',
    credFields: [
      { key: 'accessToken', label: 'Events API Access Token', placeholder: '' },
    ],
  },
};

export const marketingApi = createApi({
  reducerPath: 'marketingApi',
  baseQuery: createBaseQueryWithReauth(API_ROOT),
  tagTypes: ['MarketingDashboard', 'SourceSales', 'AdSpend', 'Pixels', 'Pixel', 'MarketingLogs'],
  endpoints: (builder) => ({
    getMarketingDashboard: builder.query<MarketingDashboardResponse, void>({
      query: () => '/marketing/dashboard',
      providesTags: ['MarketingDashboard'],
      transformResponse: (response: unknown) => unwrap<MarketingDashboardResponse>(response),
    }),

    getSourceSales: builder.query<
      SourceSalesReport,
      { groupBy?: SourceSalesGroupBy; dateFrom?: string; dateTo?: string } | void
    >({
      query: (params) => ({
        url: '/marketing/attribution/source-sales',
        params: params
          ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
          : undefined,
      }),
      providesTags: ['SourceSales'],
      transformResponse: (response: unknown) => unwrap<SourceSalesReport>(response),
    }),

    getMarketingLogs: builder.query<MarketingLogsResponse, MarketingLogsQuery | void>({
      query: (params) => ({
        url: '/marketing/logs',
        params: params
          ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
          : undefined,
      }),
      providesTags: ['MarketingLogs'],
      transformResponse: (response: unknown) => unwrap<MarketingLogsResponse>(response),
    }),

    getAdSpend: builder.query<
      AdSpendEntry[],
      { dimension?: AdSpendDimension; dateFrom?: string; dateTo?: string } | void
    >({
      query: (params) => ({
        url: '/marketing/ad-spend',
        params: params
          ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
          : undefined,
      }),
      providesTags: ['AdSpend'],
      transformResponse: (response: unknown) => unwrap<AdSpendEntry[]>(response),
    }),

    upsertAdSpend: builder.mutation<{ message: string; data: AdSpendEntry }, UpsertAdSpendBody>({
      query: (body) => ({
        url: '/marketing/ad-spend',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdSpend', 'SourceSales'],
    }),

    deleteAdSpend: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/marketing/ad-spend/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdSpend', 'SourceSales'],
    }),

    // --- Multi-instance pixels ---

    getPixels: builder.query<MarketingPixelInstance[], void>({
      query: () => '/marketing/pixels',
      providesTags: ['Pixels'],
      transformResponse: (response: unknown) => unwrap<MarketingPixelInstance[]>(response),
    }),

    getPixel: builder.query<MarketingPixelInstance, string>({
      query: (id) => `/marketing/pixels/${id}`,
      providesTags: (r, e, id) => [{ type: 'Pixel', id }],
      transformResponse: (response: unknown) => unwrap<MarketingPixelInstance>(response),
    }),

    createPixel: builder.mutation<{ message: string; data: MarketingPixelInstance }, CreatePixelBody>({
      query: (body) => ({ url: '/marketing/pixels', method: 'POST', body }),
      invalidatesTags: ['Pixels', 'MarketingDashboard'],
    }),

    updatePixel: builder.mutation<
      { message: string; data: MarketingPixelInstance },
      { id: string; body: UpdatePixelBody }
    >({
      query: ({ id, body }) => ({ url: `/marketing/pixels/${id}`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => ['Pixels', 'MarketingDashboard', { type: 'Pixel', id }],
    }),

    deletePixel: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/marketing/pixels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Pixels', 'MarketingDashboard'],
    }),

    testPixel: builder.mutation<
      { message: string; data: { logs: { transport: string; source: string; status: string }[] } },
      { id: string; eventName: string; orderRef?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/marketing/pixels/${id}/test`, method: 'POST', body }),
      invalidatesTags: ['MarketingDashboard'],
    }),

    testAllPixels: builder.mutation<
      { message: string; data: { results: { pixelId: string; label: string | null; ok: boolean }[] } },
      void
    >({
      query: () => ({ url: '/marketing/pixels/test-all', method: 'POST' }),
      invalidatesTags: ['MarketingDashboard'],
    }),

    getPageRules: builder.query<PixelPageRule[], string>({
      query: (pixelId) => `/marketing/pixels/${pixelId}/page-rules`,
      providesTags: (r, e, pixelId) => [{ type: 'Pixel', id: pixelId }],
      transformResponse: (response: unknown) => unwrap<PixelPageRule[]>(response),
    }),

    replacePageRules: builder.mutation<
      { message: string; data: PixelPageRule[] },
      { pixelId: string; rules: PageRuleInput[] }
    >({
      query: ({ pixelId, rules }) => ({
        url: `/marketing/pixels/${pixelId}/page-rules`,
        method: 'PUT',
        body: { rules },
      }),
      invalidatesTags: (r, e, { pixelId }) => ['Pixels', { type: 'Pixel', id: pixelId }],
    }),
  }),
});

export const {
  useGetMarketingDashboardQuery,
  useGetSourceSalesQuery,
  useGetMarketingLogsQuery,
  useGetAdSpendQuery,
  useUpsertAdSpendMutation,
  useDeleteAdSpendMutation,
  useGetPixelsQuery,
  useGetPixelQuery,
  useCreatePixelMutation,
  useUpdatePixelMutation,
  useDeletePixelMutation,
  useTestPixelMutation,
  useTestAllPixelsMutation,
  useGetPageRulesQuery,
  useReplacePageRulesMutation,
} = marketingApi;
