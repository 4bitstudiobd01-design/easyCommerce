import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export interface SmsLog {
  id: string;
  recipientPhone: string;
  message: string;
  gateway: string;
  status: 'SENT' | 'FAILED' | 'SANDBOX';
  tenantId: string;
  createdAt: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  tenantId: string;
  createdAt: string;
}

export const smsApi = createApi({
  reducerPath: 'smsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/sms',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['SmsLog', 'PushNotification'],
  endpoints: (builder) => ({
    getSmsLogs: builder.query<SmsLog[], void>({
      query: () => '/logs',
      providesTags: ['SmsLog'],
      transformResponse: (response: { data: SmsLog[] }) => response.data,
    }),
    getPushNotifications: builder.query<PushNotification[], void>({
      query: () => '/notifications',
      providesTags: ['PushNotification'],
      transformResponse: (response: { data: PushNotification[] }) => response.data,
    }),
    markNotificationsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['PushNotification'],
    }),
  }),
});

export const {
  useGetSmsLogsQuery,
  useGetPushNotificationsQuery,
  useMarkNotificationsReadMutation,
} = smsApi;
