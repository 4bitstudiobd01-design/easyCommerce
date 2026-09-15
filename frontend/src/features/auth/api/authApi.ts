import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { User } from '../slices/authSlice';

export interface RegisterRequest {
  email: string;
  password: string;
  /** Required by the backend DTO (min. 2 characters). */
  fullName: string;
  /** Optional; normalized to the canonical +880 form on the server. */
  phone?: string;
  storeName?: string;
  storeSlug?: string;
  subdomain?: string;
  businessType?: string;
  category?: string;
  country?: string;
  address?: string;
  acceptedTerms?: boolean;
}

export interface LoginRequest {
  /** Email address or phone number — the login form accepts either. */
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface StorePayload {
  id: string;
  name: string;
  slug: string;
  tenantId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  store?: StorePayload;
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

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1')
  .replace(/\/+$/, '')
  .replace(/\/auth$/, '');

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_ROOT}/auth`,
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
  }),
});

export const {
  useRegisterMerchantMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
