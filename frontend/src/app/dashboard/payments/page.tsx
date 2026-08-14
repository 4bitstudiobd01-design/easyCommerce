'use client';

import React, { Suspense } from 'react';
import { PaymentTransactionsView } from '@/features/payment/components/PaymentTransactionsView';
import { Skeleton } from '@/components/ui/Skeleton';

/** Matches the loaded layout so the page does not jump when data arrives. */
const PaymentsPageFallback = () => (
  <div className="space-y-5 pb-12">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40 rounded" />
        <Skeleton className="h-3 w-72 rounded" />
      </div>
      <div className="flex gap-2.5">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
    <Skeleton className="h-10 w-full max-w-lg rounded" />
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
      <div className="xl:col-span-3 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[560px] rounded-2xl" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  </div>
);

export default function PaymentsPage() {
  // useSearchParams needs a Suspense boundary during prerendering.
  return (
    <Suspense fallback={<PaymentsPageFallback />}>
      <PaymentTransactionsView />
    </Suspense>
  );
}
