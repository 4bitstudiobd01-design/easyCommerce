import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';
import { customerLogout, setCustomerTokens } from '@/features/storefront/slices/customerAuthSlice';

/** Mirrors store/baseQueryWithReauth.ts's SimpleMutex — serialises concurrent 401 refreshes. */
class SimpleMutex {
  private pending: Promise<void> | null = null;
  private releaseFn: (() => void) | null = null;

  isLocked(): boolean {
    return this.pending !== null;
  }

  async waitForUnlock(): Promise<void> {
    while (this.pending) {
      await this.pending;
    }
  }

  async acquire(): Promise<() => void> {
    await this.waitForUnlock();
    this.pending = new Promise<void>((resolve) => {
      this.releaseFn = resolve;
    });
    return () => {
      const resolve = this.releaseFn;
      this.pending = null;
      this.releaseFn = null;
      resolve?.();
    };
  }
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/orders').replace('/orders', '');

/** Every call url is shaped `/${storeSlug}/account/...` — recover the slug from it for the refresh call. */
const extractStoreSlug = (args: string | FetchArgs): string | null => {
  const url = typeof args === 'string' ? args : args.url;
  const match = url.match(/^\/?([^/]+)\//);
  return match ? match[1] : null;
};

/**
 * Customer-authenticated equivalent of createBaseQueryWithReauth — reads the
 * ec_customer_* token/refreshToken instead of the merchant's bitcommerce_*
 * ones, and refreshes via the slug-scoped storefront auth endpoint.
 */
export const createCustomerBaseQueryWithReauth = (): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${API_ROOT}/storefront`,
    prepareHeaders: (headers, { getState }) => {
      const token =
        (getState() as RootState).customerAuth.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('ec_customer_token') : null);
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  });

  const mutex = new SimpleMutex();

  return async (args, api, extraOptions) => {
    await mutex.waitForUnlock();
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) {
      return result;
    }

    const refreshToken =
      (api.getState() as RootState).customerAuth.refreshToken ||
      (typeof window !== 'undefined' ? localStorage.getItem('ec_customer_refresh_token') : null);

    const storeSlug = extractStoreSlug(args);

    if (!refreshToken || !storeSlug) {
      api.dispatch(customerLogout());
      return result;
    }

    if (mutex.isLocked()) {
      await mutex.waitForUnlock();
      return rawBaseQuery(args, api, extraOptions);
    }

    const release = await mutex.acquire();
    try {
      const refreshResult = await fetch(`${API_ROOT}/storefront/${storeSlug}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResult.ok) {
        api.dispatch(customerLogout());
        return result;
      }

      const payload = await refreshResult.json();
      const data = payload?.data ?? payload;

      if (!data?.accessToken) {
        api.dispatch(customerLogout());
        return result;
      }

      api.dispatch(setCustomerTokens({ token: data.accessToken, refreshToken: data.refreshToken }));

      result = await rawBaseQuery(args, api, extraOptions);
    } catch {
      return result;
    } finally {
      release();
    }

    return result;
  };
};
