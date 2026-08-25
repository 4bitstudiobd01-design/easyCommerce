import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { User } from '../slices/authSlice';

export interface RegisterRequest {
  email: string;
  password: string;
  /** Required by the backend DTO (min. 2 characters). */
  fullName: string;
  /** Optional; normalized to the canonical +880 form on the server. */
  phone?: string;
  /** Provide together with storeSlug to create the merchant's first store in the same request. */
  storeName?: string;
  storeSlug?: string;
  businessType?: string;
  country?: string;
  /** Must be true — the backend rejects registration otherwise. */
  acceptedTerms: boolean;
}

export interface LoginRequest {
  /** Email address or phone number — the login form accepts either. */
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface DevMerchantStore {
  id: string;
  name: string;
  slug: string;
}

export interface DevMerchant {
  userId: string;
  fullName: string;
  email: string;
  stores: DevMerchantStore[];
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/auth',
  }),
  endpoints: (builder) => ({
    registerMerchant: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: '/register',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: { data: AuthResponse }) => response.data,
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: { data: AuthResponse }) => response.data,
    }),
    forgotPassword: builder.mutation<MessageResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/forgot-password',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: MessageResponse }) => response.data,
    }),
    resetPassword: builder.mutation<MessageResponse, ResetPasswordRequest>({
      query: (body) => ({
        url: '/reset-password',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: MessageResponse }) => response.data,
    }),
    /** Dev-only: the backend hard-disables this outside non-production environments. */
    getDevMerchants: builder.query<DevMerchant[], void>({
      query: () => '/dev/merchants',
      transformResponse: (response: { data: DevMerchant[] }) => response.data,
    }),
    /** Dev-only: logs in as the chosen merchant without a password. */
    devLoginAs: builder.mutation<AuthResponse, { userId: string }>({
      query: (body) => ({
        url: '/dev/login-as',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: AuthResponse }) => response.data,
    }),
  }),
});

export const {
  useRegisterMerchantMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetDevMerchantsQuery,
  useDevLoginAsMutation,
} = authApi;
