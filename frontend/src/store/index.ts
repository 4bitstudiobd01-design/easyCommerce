import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '@/features/auth/api/authApi';
import authReducer from '@/features/auth/slices/authSlice';
import { tenantApi } from '@/features/tenant/api/tenantApi';
import tenantReducer from '@/features/tenant/slices/tenantSlice';
import { catalogApi } from '@/features/catalog/api/catalogApi';
import catalogReducer from '@/features/catalog/slices/catalogSlice';
import { inventoryApi } from '@/features/inventory/api/inventoryApi';
import inventoryReducer from '@/features/inventory/slices/inventorySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    catalog: catalogReducer,
    inventory: inventoryReducer,
    [authApi.reducerPath]: authApi.reducer,
    [tenantApi.reducerPath]: tenantApi.reducer,
    [catalogApi.reducerPath]: catalogApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      tenantApi.middleware,
      catalogApi.middleware,
      inventoryApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
