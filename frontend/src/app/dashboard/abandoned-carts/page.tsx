'use client';

import React, { Suspense } from 'react';
import { AbandonedCartsView } from '@/features/order/components/AbandonedCartsView';
import { Skeleton } from '@/components/ui/Skeleton';

/** Matches the loaded layout so the page does not jump when data arrives. */
const AbandonedCartsPageFallback = () => (
  <div className="space-y-5 pb-12">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44 rounded" />
        <Skeleton className="h-3 w-96 rounded" />
      </div>
      <div className="flex gap-2.5">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
    <Skeleton className="h-10 w-full max-w-lg rounded" />
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[620px] rounded-2xl" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  </div>
);

export default function AbandonedCartsPage() {
  // useSearchParams needs a Suspense boundary during prerendering.
  return (
    <Suspense fallback={<AbandonedCartsPageFallback />}>
      <AbandonedCartsView />
    </Suspense>
  );
}
