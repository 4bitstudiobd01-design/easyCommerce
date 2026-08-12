import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
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
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_ROOT}/billing`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Subscription'],
  endpoints: (builder) => ({
    getPlans: builder.query<Plan[], void>({
      query: () => '/plans',
    }),
    getMySubscription: builder.query<SubscriptionSnapshot, void>({
      query: () => '/subscription',
      providesTags: ['Subscription'],
    }),
    initiatePlanRenewal: builder.mutation<InitiatePlanRenewalResponse, { planCode: PlanCode }>({
      query: (body) => ({
        url: '/subscription/renew',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useInitiatePlanRenewalMutation,
} = billingApi;
