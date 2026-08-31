import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '@/features/auth/api/authApi';
import authReducer from '@/features/auth/slices/authSlice';
import { tenantApi } from '@/features/tenant/api/tenantApi';
import tenantReducer from '@/features/tenant/slices/tenantSlice';
import { catalogApi } from '@/features/catalog/api/catalogApi';
import catalogReducer from '@/features/catalog/slices/catalogSlice';
import { inventoryApi } from '@/features/inventory/api/inventoryApi';
import inventoryReducer from '@/features/inventory/slices/inventorySlice';
import { storefrontApi } from '@/features/storefront/api/storefrontApi';
import cartReducer from '@/features/storefront/slices/cartSlice';
import { customerAuthApi } from '@/features/storefront/api/customerAuthApi';
import { customerAccountApi } from '@/features/storefront/api/customerAccountApi';
import customerAuthReducer from '@/features/storefront/slices/customerAuthSlice';
import { orderApi } from '@/features/order/api/orderApi';
import orderReducer from '@/features/order/slices/orderSlice';
import { paymentApi } from '@/features/payment/api/paymentApi';
import { analyticsApi } from '@/features/analytics/api/analyticsApi';
import { logisticsApi } from '@/features/logistics/api/logisticsApi';
import { adminApi } from '@/features/admin/api/adminApi';
import { smsApi } from '@/features/sms/api/smsApi';
import { couponApi } from '@/features/coupon/api/couponApi';
import { staffApi } from '@/features/staff/api/staffApi';
import staffReducer from '@/features/staff/slices/staffSlice';
import { emailMarketingApi } from '@/features/email-marketing/api/emailMarketingApi';
import emailMarketingReducer from '@/features/email-marketing/slices/emailMarketingSlice';
import { seoApi } from '@/features/seo/api/seoApi';
import { billingApi } from '@/features/billing/api/billingApi';
import { customerApi } from '@/features/customer/api/customerApi';
import { marketingApi } from '@/features/marketing/api/marketingApi';
import { blogApi } from '@/features/blog/api/blogApi';
import { crmApi } from '@/features/crm/api/crmApi';
import { omnichannelApi } from '@/features/crm/api/omnichannelApi';
import { hrmApi } from '@/features/hrm/api/hrmApi';
import { accountingApi } from '@/features/accounting/api/accountingApi';
import { purchaseApi } from '@/features/purchase/api/purchaseApi';
import { financeApi } from '@/features/finance/api/financeApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    catalog: catalogReducer,
    inventory: inventoryReducer,
    cart: cartReducer,
    customerAuth: customerAuthReducer,
    order: orderReducer,
    staff: staffReducer,
    emailMarketing: emailMarketingReducer,
    [authApi.reducerPath]: authApi.reducer,
    [tenantApi.reducerPath]: tenantApi.reducer,
    [catalogApi.reducerPath]: catalogApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [storefrontApi.reducerPath]: storefrontApi.reducer,
    [customerAuthApi.reducerPath]: customerAuthApi.reducer,
    [customerAccountApi.reducerPath]: customerAccountApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [logisticsApi.reducerPath]: logisticsApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [smsApi.reducerPath]: smsApi.reducer,
    [couponApi.reducerPath]: couponApi.reducer,
    [staffApi.reducerPath]: staffApi.reducer,
    [emailMarketingApi.reducerPath]: emailMarketingApi.reducer,
    [seoApi.reducerPath]: seoApi.reducer,
    [billingApi.reducerPath]: billingApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [marketingApi.reducerPath]: marketingApi.reducer,
    [blogApi.reducerPath]: blogApi.reducer,
    [crmApi.reducerPath]: crmApi.reducer,
    [omnichannelApi.reducerPath]: omnichannelApi.reducer,
    [hrmApi.reducerPath]: hrmApi.reducer,
    [accountingApi.reducerPath]: accountingApi.reducer,
    [purchaseApi.reducerPath]: purchaseApi.reducer,
    [financeApi.reducerPath]: financeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      tenantApi.middleware,
      catalogApi.middleware,
      inventoryApi.middleware,
      storefrontApi.middleware,
      customerAuthApi.middleware,
      customerAccountApi.middleware,
      orderApi.middleware,
      paymentApi.middleware,
      analyticsApi.middleware,
      logisticsApi.middleware,
      adminApi.middleware,
      smsApi.middleware,
      couponApi.middleware,
      staffApi.middleware,
      emailMarketingApi.middleware,
      seoApi.middleware,
      billingApi.middleware,
      customerApi.middleware,
      marketingApi.middleware,
      blogApi.middleware,
      crmApi.middleware,
      omnichannelApi.middleware,
      hrmApi.middleware,
      accountingApi.middleware,
      purchaseApi.middleware,
      financeApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
