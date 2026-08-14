'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { InventoryHistoryView } from '@/features/inventory/components/InventoryHistoryView';

export default function ItemInventoryHistoryPage() {
  const params = useParams();
  const inventoryId = (params?.id as string) || '';

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse p-4">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      }
    >
      <InventoryHistoryView inventoryId={inventoryId} />
    </Suspense>
  );
}
