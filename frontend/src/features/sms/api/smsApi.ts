import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
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
  referenceType?: string | null;
  referenceId?: string | null;
  tenantId: string;
  createdAt: string;
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1')
  .replace(/\/+$/, '')
  .replace(/\/sms$/, '');

export const smsApi = createApi({
  reducerPath: 'smsApi',
  baseQuery: createBaseQueryWithReauth(`${API_ROOT}/sms`),
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
    markNotificationRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
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
  useMarkNotificationReadMutation,
} = smsApi;
