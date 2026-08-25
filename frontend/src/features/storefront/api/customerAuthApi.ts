import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CustomerUser } from '../slices/customerAuthSlice';

export interface CustomerRegisterRequest {
  storeSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  channel?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerHost?: string;
}

export interface CustomerLoginRequest {
  storeSlug: string;
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CustomerAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: CustomerUser;
}

// Same base-URL-stripping idiom as attribution.ts's TRACKING_ENDPOINT — the
// env var points at `.../orders` by convention, so strip that suffix to get
// the API root, then append the slug-scoped storefront auth path per call.
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/orders').replace('/orders', '');

export const customerAuthApi = createApi({
  reducerPath: 'customerAuthApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${API_ROOT}/storefront` }),
  endpoints: (builder) => ({
    registerCustomer: builder.mutation<CustomerAuthResponse, CustomerRegisterRequest>({
      query: ({ storeSlug, ...body }) => ({
        url: `/${storeSlug}/auth/register`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: CustomerAuthResponse }) => response.data,
    }),
    loginCustomer: builder.mutation<CustomerAuthResponse, CustomerLoginRequest>({
      query: ({ storeSlug, ...body }) => ({
        url: `/${storeSlug}/auth/login`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: CustomerAuthResponse }) => response.data,
    }),
  }),
});

export const { useRegisterCustomerMutation, useLoginCustomerMutation } = customerAuthApi;
