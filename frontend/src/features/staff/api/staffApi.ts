import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export type StaffPermissionType =
  | 'products:read'
  | 'products:write'
  | 'orders:read'
  | 'orders:manage'
  | 'inventory:read'
  | 'inventory:transfer'
  | 'reviews:read'
  | 'reviews:moderate'
  | 'customers:read'
  | 'coupons:read'
  | 'coupons:write'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write'
  | 'staff:manage';

export interface StaffMember {
  id: string;
  tenantId: string;
  storeId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: StaffPermissionType[];
  status: 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED';
  inviteToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteStaffRequest {
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: StaffPermissionType[];
}

export interface UpdateStaffPermissionsRequest {
  staffId: string;
  role?: string;
  permissions?: StaffPermissionType[];
  status?: 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED';
}

export interface AcceptStaffInviteRequest {
  token: string;
  password: string;
}

export interface MyPermissionsResponse {
  role: string;
  isOwner: boolean;
  permissions: StaffPermissionType[];
}

export const staffApi = createApi({
  reducerPath: 'staffApi',
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
  tagTypes: ['Staff', 'Permissions'],
  endpoints: (builder) => ({
    getStaffMembers: builder.query<StaffMember[], void>({
      query: () => '/staff',
      providesTags: ['Staff'],
      transformResponse: (response: { data: StaffMember[] } | StaffMember[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    inviteStaff: builder.mutation<StaffMember, InviteStaffRequest>({
      query: (body) => ({
        url: '/staff/invite',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff'],
      transformResponse: (response: { data: StaffMember } | StaffMember) =>
        (response as any).data || response,
    }),
    updateStaffPermissions: builder.mutation<StaffMember, UpdateStaffPermissionsRequest>({
      query: ({ staffId, ...body }) => ({
        url: `/staff/${staffId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Staff', 'Permissions'],
      transformResponse: (response: { data: StaffMember } | StaffMember) =>
        (response as any).data || response,
    }),
    deleteStaff: builder.mutation<{ success: boolean; message: string }, string>({
      query: (staffId) => ({
        url: `/staff/${staffId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
      transformResponse: (response: { data: { success: boolean; message: string } } | any) =>
        (response as any).data || response,
    }),
    acceptStaffInvite: builder.mutation<{ success: boolean; message: string }, AcceptStaffInviteRequest>({
      query: (body) => ({
        url: '/staff/accept-invite',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff'],
      transformResponse: (response: { data: { success: boolean; message: string } } | any) =>
        (response as any).data || response,
    }),
    getMyPermissions: builder.query<MyPermissionsResponse, void>({
      query: () => '/staff/my-permissions',
      providesTags: ['Permissions'],
      transformResponse: (response: { data: MyPermissionsResponse } | MyPermissionsResponse) =>
        (response as any).data || response,
    }),
  }),
});

export const {
  useGetStaffMembersQuery,
  useInviteStaffMutation,
  useUpdateStaffPermissionsMutation,
  useDeleteStaffMutation,
  useAcceptStaffInviteMutation,
  useGetMyPermissionsQuery,
} = staffApi;
