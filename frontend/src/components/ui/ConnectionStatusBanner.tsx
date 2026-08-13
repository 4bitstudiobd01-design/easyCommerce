'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Surfaces a lost API connection.
 *
 * When the backend was down every dashboard screen simply rendered empty — no error,
 * no explanation — which was indistinguishable from "this store has no data". This
 * watches RTK Query for network-level failures (status FETCH_ERROR) and tells the user
 * what is actually wrong.
 */
export function ConnectionStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);

  // A network-level failure in any RTK Query slice shows up as FETCH_ERROR.
  const hasFetchError = useSelector((state: RootState) => {
    const queries = Object.values(state as Record<string, any>)
      .filter((slice) => slice && typeof slice === 'object' && 'queries' in slice)
      .flatMap((slice: any) => Object.values(slice.queries || {}));

    return queries.some(
      (q: any) => q?.status === 'rejected' && q?.error?.status === 'FETCH_ERROR',
    );
  });

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!hasFetchError && !isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-3 text-amber-900"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <p className="text-xs font-semibold">
        {isOffline
          ? 'You are offline. Data shown may be out of date.'
          : 'Cannot reach the server — data may be missing or out of date.'}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}
