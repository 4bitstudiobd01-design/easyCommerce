'use client';

import React, { Suspense } from 'react';
import { PurchaseMainView } from '@/features/purchase/components/PurchaseMainView';

export default function PurchasePage() {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs text-slate-400">Loading purchase...</div>}>
      <PurchaseMainView />
    </Suspense>
  );
}
