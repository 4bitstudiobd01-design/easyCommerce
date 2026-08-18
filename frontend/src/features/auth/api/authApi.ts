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
  }),
});

export const { useRegisterMerchantMutation, useLoginMutation } = authApi;
