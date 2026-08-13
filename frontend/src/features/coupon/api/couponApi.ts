import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiryDate?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
}

export interface CreateCouponRequest {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiryDate?: string;
}

export interface ValidateCouponResponse {
  isValid: boolean;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  calculatedDiscount: number;
  message: string;
}

export const couponApi = createApi({
  reducerPath: 'couponApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/coupons'),
  tagTypes: ['Coupon'],
  endpoints: (builder) => ({
    getMerchantCoupons: builder.query<Coupon[], void>({
      query: () => '',
      providesTags: ['Coupon'],
      transformResponse: (response: { data: Coupon[] }) => response.data,
    }),
    createCoupon: builder.mutation<Coupon, CreateCouponRequest>({
      query: (couponData) => ({
        url: '',
        method: 'POST',
        body: couponData,
      }),
      invalidatesTags: ['Coupon'],
      transformResponse: (response: { data: Coupon }) => response.data,
    }),
    validatePublicCoupon: builder.mutation<
      ValidateCouponResponse,
      { storeSlug: string; code: string; subtotal: number }
    >({
      query: (body) => ({
        url: '/public/validate',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: ValidateCouponResponse }) => response.data,
    }),
  }),
});

export const {
  useGetMerchantCouponsQuery,
  useCreateCouponMutation,
  useValidatePublicCouponMutation,
} = couponApi;
