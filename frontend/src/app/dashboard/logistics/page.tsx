'use client';

import React, { Suspense } from 'react';
import { ShipmentsView } from '@/features/logistics/components/ShipmentsView';
import { Skeleton } from '@/components/ui/Skeleton';

/** Matches the loaded layout so the page does not jump when data arrives. */
const CourierPageFallback = () => (
  <div className="space-y-5 pb-12">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="h-3 w-80 rounded" />
      </div>
      <div className="flex gap-2.5">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
    </div>
    <Skeleton className="h-10 w-full max-w-2xl rounded" />
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
      <div className="xl:col-span-3 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[620px] rounded-2xl" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  </div>
);

export default function CourierPage() {
  // useSearchParams needs a Suspense boundary during prerendering.
  return (
    <Suspense fallback={<CourierPageFallback />}>
      <ShipmentsView />
    </Suspense>
  );
}
