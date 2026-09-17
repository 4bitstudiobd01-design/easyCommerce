'use client';

import React, { Suspense } from 'react';
import { MarketingView } from '@/features/marketing/components/MarketingView';
import { Skeleton } from '@/components/ui/Skeleton';

const MarketingPageFallback = () => (
  <div className="flex flex-col h-full bg-white">
    <div className="bg-white border-b border-slate-200 px-8 py-4 shrink-0 space-y-2">
      <Skeleton className="h-6 w-36 rounded" />
      <Skeleton className="h-4 w-72 rounded" />
    </div>
    <div className="bg-white border-b border-slate-200 px-8 flex items-center gap-8 py-3">
      <Skeleton className="h-5 w-28 rounded" />
      <Skeleton className="h-5 w-28 rounded" />
    </div>
    <div className="p-8 space-y-4">
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
);

export default function MarketingPage() {
  // useSearchParams needs a Suspense boundary during prerendering.
  return (
    <Suspense fallback={<MarketingPageFallback />}>
      <MarketingView />
    </Suspense>
  );
}

