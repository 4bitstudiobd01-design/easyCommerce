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
import { orderApi } from '@/features/order/api/orderApi';
import orderReducer from '@/features/order/slices/orderSlice';
import { paymentApi } from '@/features/payment/api/paymentApi';
import { analyticsApi } from '@/features/analytics/api/analyticsApi';
import { logisticsApi } from '@/features/logistics/api/logisticsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    catalog: catalogReducer,
    inventory: inventoryReducer,
    cart: cartReducer,
    order: orderReducer,
    [authApi.reducerPath]: authApi.reducer,
    [tenantApi.reducerPath]: tenantApi.reducer,
    [catalogApi.reducerPath]: catalogApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [storefrontApi.reducerPath]: storefrontApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [logisticsApi.reducerPath]: logisticsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      tenantApi.middleware,
      catalogApi.middleware,
      inventoryApi.middleware,
      storefrontApi.middleware,
      orderApi.middleware,
      paymentApi.middleware,
      analyticsApi.middleware,
      logisticsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
