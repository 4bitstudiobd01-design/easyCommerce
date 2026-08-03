import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export interface NewsletterSubscriber {
  id: string;
  tenantId: string;
  storeId: string;
  email: string;
  name?: string;
  isSubscribed: boolean;
  source: string;
  subscribedAt: string;
  createdAt: string;
}

export interface EmailCampaign {
  id: string;
  tenantId: string;
  storeId: string;
  title: string;
  subject: string;
  contentHtml: string;
  recipientType: 'ALL_SUBSCRIBERS' | 'ALL_CUSTOMERS' | 'ALL_AUDIENCE';
  totalSent: number;
  status: 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
  createdAt: string;
}

export interface CreateCampaignRequest {
  title: string;
  subject: string;
  contentHtml: string;
  recipientType: 'ALL_SUBSCRIBERS' | 'ALL_CUSTOMERS' | 'ALL_AUDIENCE';
}

export interface PublicSubscribeRequest {
  storeSlug: string;
  email: string;
  name?: string;
  source?: string;
}

export const emailMarketingApi = createApi({
  reducerPath: 'emailMarketingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token || (typeof window !== 'undefined' ? localStorage.getItem('easycommerce_token') : null);
      const activeStoreId = state.tenant?.currentStore?.id || (typeof window !== 'undefined' ? localStorage.getItem('easycommerce_active_store_id') : null);
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      if (activeStoreId) {
        headers.set('x-store-id', activeStoreId);
      }
      return headers;
    },
  }),
  tagTypes: ['EmailSubscribers', 'EmailCampaigns'],
  endpoints: (builder) => ({
    getSubscribers: builder.query<NewsletterSubscriber[], void>({
      query: () => '/email-marketing/subscribers',
      providesTags: ['EmailSubscribers'],
      transformResponse: (response: { data: NewsletterSubscriber[] } | NewsletterSubscriber[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    getCampaigns: builder.query<EmailCampaign[], void>({
      query: () => '/email-marketing/campaigns',
      providesTags: ['EmailCampaigns'],
      transformResponse: (response: { data: EmailCampaign[] } | EmailCampaign[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    createCampaign: builder.mutation<EmailCampaign, CreateCampaignRequest>({
      query: (body) => ({
        url: '/email-marketing/campaigns',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['EmailCampaigns'],
      transformResponse: (response: { data: EmailCampaign } | EmailCampaign) =>
        (response as any).data || response,
    }),
    sendCampaignBroadcast: builder.mutation<
      { success: boolean; totalSent: number; campaign: EmailCampaign },
      string
    >({
      query: (campaignId) => ({
        url: `/email-marketing/campaigns/${campaignId}/send`,
        method: 'POST',
      }),
      invalidatesTags: ['EmailCampaigns'],
      transformResponse: (
        response: { data: { success: boolean; totalSent: number; campaign: EmailCampaign } } | any,
      ) => (response as any).data || response,
    }),
    subscribePublic: builder.mutation<
      { success: boolean; message: string; subscriber: NewsletterSubscriber },
      PublicSubscribeRequest
    >({
      query: (body) => ({
        url: '/email-marketing/public/subscribe',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['EmailSubscribers'],
      transformResponse: (response: { data: any } | any) => (response as any).data || response,
    }),
  }),
});

export const {
  useGetSubscribersQuery,
  useGetCampaignsQuery,
  useCreateCampaignMutation,
  useSendCampaignBroadcastMutation,
  useSubscribePublicMutation,
} = emailMarketingApi;
