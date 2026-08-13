import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export type PlanCode = 'FREE' | 'GROWTH' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED';

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  monthlyPriceBdt: number;
  maxStores: number | null;
  maxStaffPerStore: number | null;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  gracePeriodEndsAt: string | null;
}

export interface SubscriptionSnapshot {
  subscription: Subscription;
  plan: Plan;
}

export interface InitiatePlanRenewalResponse {
  isFree: boolean;
  gatewayUrl?: string;
  tranId?: string;
  message?: string;
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/stores').replace('/stores', '');

export const billingApi = createApi({
  reducerPath: 'billingApi',
  baseQuery: createBaseQueryWithReauth(`${API_ROOT}/billing`),
  tagTypes: ['Subscription'],
  endpoints: (builder) => ({
    getPlans: builder.query<Plan[], void>({
      query: () => '/plans',
      transformResponse: (response: { data: Plan[] }) => response.data,
    }),
    getMySubscription: builder.query<SubscriptionSnapshot, void>({
      query: () => '/subscription',
      providesTags: ['Subscription'],
      transformResponse: (response: { data: SubscriptionSnapshot }) => response.data,
    }),
    initiatePlanRenewal: builder.mutation<InitiatePlanRenewalResponse, { planCode: PlanCode }>({
      query: (body) => ({
        url: '/subscription/renew',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
      transformResponse: (response: { data: InitiatePlanRenewalResponse }) => response.data,
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useInitiatePlanRenewalMutation,
} = billingApi;
