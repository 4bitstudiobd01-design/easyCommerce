import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';
import { logout, setTokens } from '@/features/auth/slices/authSlice';

/**
 * Minimal single-slot lock. A dedicated mutex package would be one more dependency for
 * ~15 lines of logic, and this repo is deliberately lean.
 */
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

const AUTH_BASE_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/auth` : 'http://localhost:5001/api/v1/auth')
).replace(/\/+$/, '');

/**
 * Builds a baseQuery that transparently recovers from an expired access token.
 *
 * Access tokens last 15 minutes but the session cookie lasts 7 days, so previously the
 * dashboard stayed "logged in" while every request 401'd — the merchant just saw empty
 * screens with no explanation. Now a 401 triggers one refresh attempt and the original
 * request is replayed; only if the refresh itself fails is the session cleared.
 */
export const createBaseQueryWithReauth = (baseUrl: string): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token =
        (getState() as RootState).auth.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('bitcommerce_token') : null);
      if (token) headers.set('authorization', `Bearer ${token}`);

      const storeId =
        typeof window !== 'undefined' ? localStorage.getItem('bitcommerce_active_store_id') : null;
      if (storeId) headers.set('x-store-id', storeId);

      return headers;
    },
  });

  // Serialises refreshes: without it, ten screens loading at once would each fire their
  // own refresh, and the losing responses would install stale tokens.
  const mutex = new SimpleMutex();

  return async (args, api, extraOptions) => {
    await mutex.waitForUnlock();
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) {
      return result;
    }

    const refreshToken =
      (api.getState() as RootState).auth.refreshToken ||
      (typeof window !== 'undefined' ? localStorage.getItem('bitcommerce_refresh_token') : null);

    if (!refreshToken) {
      api.dispatch(logout());
      return result;
    }

    if (mutex.isLocked()) {
      // Another request is already refreshing — wait for it, then retry with the token
      // it installed rather than starting a second refresh.
      await mutex.waitForUnlock();
      return rawBaseQuery(args, api, extraOptions);
    }

    const release = await mutex.acquire();
    try {
      const refreshResult = await fetch(`${AUTH_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResult.ok) {
        api.dispatch(logout());
        return result;
      }

      const payload = await refreshResult.json();
      const data = payload?.data ?? payload;

      if (!data?.accessToken) {
        api.dispatch(logout());
        return result;
      }

      api.dispatch(
        setTokens({ token: data.accessToken, refreshToken: data.refreshToken }),
      );

      // Replay the original request with the new token.
      result = await rawBaseQuery(args, api, extraOptions);
    } catch {
      // Network failure during refresh: keep the session so the user is not logged out
      // just because the API was briefly unreachable.
      return result;
    } finally {
      release();
    }

    return result;
  };
};
