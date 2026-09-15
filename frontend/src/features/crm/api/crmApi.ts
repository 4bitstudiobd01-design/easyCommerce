import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import {
  Customer360,
  Lead,
  CustomerSegment,
  CrmActivity,
  CrmAnalyticsMetrics,
  LeadStageType,
} from '../types/crm.types';
import {
  mockCustomers,
  mockLeads,
  mockSegments,
  mockActivities,
  mockCrmAnalytics,
} from '../data/crmMockData';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1')
  .replace(/\/+$/, '')
  .replace(/\/customers$/, '');

export const crmApi = createApi({
  reducerPath: 'crmApi',
  baseQuery: createBaseQueryWithReauth(`${API_ROOT}/customers`),
  tagTypes: ['CrmCustomer', 'CrmLead', 'CrmSegment', 'CrmActivity', 'CrmAnalytics'],
  endpoints: (builder) => ({
    // Customers 360
    getCrmCustomers: builder.query<{ data: Customer360[]; total: number }, { search?: string; status?: string; segment?: string; page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '',
        params: params || {},
      }),
      providesTags: ['CrmCustomer'],
      transformResponse: (response: any) => {
        const payload = response?.data ?? response;
        const list = Array.isArray(payload) ? payload : payload?.data;
        if (Array.isArray(list) && list.length > 0) {
          return {
            data: list.map((c: any) => ({
              ...c,
              fullName: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || 'Valued Customer',
              totalSpent: Number(c.totalSpent || 0),
              ordersCount: Number(c.ordersCount || 0),
              avgOrderValue: Number(c.avgOrderValue || (c.ordersCount ? Math.round(c.totalSpent / c.ordersCount) : 0)),
            })),
            total: payload?.meta?.total ?? list.length,
          };
        }
        return { data: mockCustomers, total: mockCustomers.length };
      },
    }),

    getCustomerById360: builder.query<Customer360, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'CrmCustomer', id }],
      transformResponse: (response: any, meta, arg) => {
        const c = response?.data ?? response;
        if (c && c.id) {
          return {
            ...c,
            fullName: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || 'Valued Customer',
            totalSpent: Number(c.totalSpent || 0),
            ordersCount: Number(c.ordersCount || 0),
            avgOrderValue: Number(c.avgOrderValue || (c.ordersCount ? Math.round(c.totalSpent / c.ordersCount) : 0)),
          };
        }
        const foundMock = mockCustomers.find((m) => m.id === arg);
        return foundMock || mockCustomers[0];
      },
    }),

    createCrmCustomer: builder.mutation<Customer360, Partial<Customer360> & { firstName: string; lastName: string; phone: string }>({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CrmCustomer', 'CrmAnalytics'],
      transformResponse: (response: any) => {
        const c = response?.data ?? response;
        return {
          ...c,
          fullName: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || 'Valued Customer',
          totalSpent: Number(c.totalSpent || 0),
          ordersCount: Number(c.ordersCount || 0),
          avgOrderValue: Number(c.avgOrderValue || 0),
        };
      },
    }),

    seedCrmCustomers: builder.mutation<Customer360[], void>({
      query: () => ({
        url: '/seed',
        method: 'POST',
      }),
      invalidatesTags: ['CrmCustomer', 'CrmAnalytics'],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    // Leads Pipeline
    getCrmLeads: builder.query<Lead[], { stage?: string; search?: string } | void>({
      query: (params) => ({
        url: '/leads',
        params: params || {},
      }),
      providesTags: ['CrmLead'],
      transformResponse: (response: any) => {
        const payload = response?.data ?? response;
        if (Array.isArray(payload)) return payload;
        return [];
      },
    }),

    seedCrmLeads: builder.mutation<Lead[], void>({
      query: () => ({
        url: '/leads/seed',
        method: 'POST',
      }),
      invalidatesTags: ['CrmLead', 'CrmActivity'],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    createCrmLead: builder.mutation<Lead, Partial<Lead>>({
      query: (body) => ({
        url: '/leads',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CrmLead', 'CrmActivity'],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    updateLeadStage: builder.mutation<Lead, { id: string; stage: LeadStageType; lostReason?: string }>({
      query: ({ id, ...body }) => ({
        url: `/leads/${id}/stage`,
        method: 'PATCH',
        body,
      }),
      async onQueryStarted({ id, stage, lostReason }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          crmApi.util.updateQueryData('getCrmLeads', undefined, (draft) => {
            if (Array.isArray(draft)) {
              const lead = draft.find((l) => l.id === id);
              if (lead) {
                lead.stage = stage;
                if (lostReason) lead.lostReason = lostReason;
                lead.updatedAt = new Date().toISOString();
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['CrmLead', 'CrmActivity'],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    scheduleLeadFollowUp: builder.mutation<Lead, { id: string; followUpAt: string | null; note?: string }>({
      query: ({ id, ...body }) => ({
        url: `/leads/${id}/follow-up`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['CrmLead'],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    convertLeadToCustomer: builder.mutation<Customer360, { leadId: string; createInitialOrder?: boolean }>({
      query: ({ leadId, ...body }) => ({
        url: `/leads/${leadId}/convert`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CrmLead', 'CrmCustomer', 'CrmActivity', 'CrmAnalytics'],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    // Audience Segments
    getCrmSegments: builder.query<CustomerSegment[], void>({
      query: () => '/segments',
      providesTags: ['CrmSegment'],
      transformResponse: (response: any) => {
        const payload = response?.data ?? response;
        if (Array.isArray(payload)) return payload;
        return [];
      },
    }),

    getSegmentCustomers: builder.query<Customer360[], string>({
      query: (segmentId) => `/segments/${segmentId}/customers`,
      providesTags: (result, error, id) => [{ type: 'CrmSegment', id }],
      transformResponse: (response: any) => {
        const payload = response?.data ?? response;
        if (Array.isArray(payload)) return payload;
        return [];
      },
    }),

    createCrmSegment: builder.mutation<CustomerSegment, Partial<CustomerSegment>>({
      query: (body) => ({
        url: '/segments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CrmSegment'],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    // Omnichannel Activities (store-wide real feed)
    getCrmActivities: builder.query<CrmActivity[], { type?: string; search?: string; limit?: number } | void>({
      query: (params) => ({
        url: '/activities/all',
        params: params
          ? {
              ...(params.type && params.type !== 'ALL' ? { type: params.type } : {}),
              ...(params.search ? { search: params.search } : {}),
              ...(params.limit ? { limit: params.limit } : {}),
            }
          : {},
      }),
      providesTags: ['CrmActivity'],
      transformResponse: (response: any) => {
        // Handle double-wrapped response: {success, data: {success, data: []}}
        const payload = response?.data?.data ?? response?.data ?? response;
        if (!Array.isArray(payload)) return [];
        return payload.map((item: any) => ({
          ...item,
          authorName: item.actorName || item.authorName || 'System',
          type: item.type as any,
        }));
      },
    }),

    logCrmActivity: builder.mutation<CrmActivity, Partial<CrmActivity>>({
      query: (body) => ({
        url: '/activities',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CrmActivity', 'CrmCustomer'],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    // CRM Analytics — Full real-data analytics
    getCrmAnalytics: builder.query<CrmAnalyticsMetrics, void>({
      query: () => '/analytics/full',
      providesTags: ['CrmAnalytics'],
      transformResponse: (response: any) => {
        // Double-wrapped: {success, data: {success, data: {...}}}
        const d = response?.data?.data ?? response?.data ?? response;
        if (!d || !('totalCustomers' in d)) return {} as CrmAnalyticsMetrics;
        return {
          totalCustomers: Number(d.totalCustomers || 0),
          activeCustomers: Number(d.activeCustomers || 0),
          newCustomers: Number(d.newCustomers || 0),
          repeatCustomers: Number(d.repeatCustomers || 0),
          avgCustomerLtv: Number(d.avgCustomerLtv || 0),
          repeatPurchaseRate: Number(d.repeatPurchaseRate || 0),
          totalRevenue: Number(d.totalRevenue || 0),
          avgOrderValue: Number(d.avgOrderValue || 0),
          churnRate: Number(d.churnRate || 0),
          totalLeads: Number(d.totalLeads || 0),
          convertedLeads: Number(d.convertedLeads || 0),
          leadConversionRate: Number(d.leadConversionRate || 0),
          pipelineValue: Number(d.pipelineValue || 0),
          rfmBreakdown: {
            vip: Number(d.rfmBreakdown?.vip || 0),
            loyal: Number(d.rfmBreakdown?.loyal || 0),
            promising: Number(d.rfmBreakdown?.promising || 0),
            atRisk: Number(d.rfmBreakdown?.atRisk || 0),
            dormant: Number(d.rfmBreakdown?.dormant || 0),
          },
          acquisitionChannels: Array.isArray(d.acquisitionChannels) ? d.acquisitionChannels : [],
          topSpenders: Array.isArray(d.topSpenders) ? d.topSpenders : [],
        };
      },
    }),
  }),
});

export const {
  useGetCrmCustomersQuery,
  useGetCustomerById360Query,
  useCreateCrmCustomerMutation,
  useSeedCrmCustomersMutation,
  useGetCrmLeadsQuery,
  useSeedCrmLeadsMutation,
  useCreateCrmLeadMutation,
  useUpdateLeadStageMutation,
  useScheduleLeadFollowUpMutation,
  useConvertLeadToCustomerMutation,
  useGetCrmSegmentsQuery,
  useGetSegmentCustomersQuery,
  useCreateCrmSegmentMutation,
  useGetCrmActivitiesQuery,
  useLogCrmActivityMutation,
  useGetCrmAnalyticsQuery,
} = crmApi;
