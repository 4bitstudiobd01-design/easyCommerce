'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CodSummary } from '../api/logisticsApi';
import { formatCurrency } from '../utils/shipmentFormatters';

interface CodSummaryCardProps {
  codSummary?: CodSummary;
  currency: string;
  isLoading: boolean;
  onViewAll?: () => void;
}

export const CodSummaryCard = ({
  codSummary,
  currency,
  isLoading,
  onViewAll,
}: CodSummaryCardProps) => {
  if (isLoading || !codSummary) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
        <Skeleton className="h-4 w-40 rounded mb-5" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  const rows = [
    { label: 'Total COD', value: codSummary.total, valueClass: 'text-slate-900' },
    { label: 'Collected', value: codSummary.collected, valueClass: 'text-emerald-600' },
    {
      label: 'Pending Settlement',
      value: codSummary.pendingSettlement,
      valueClass: 'text-amber-600',
    },
    { label: 'Returned COD', value: codSummary.returned, valueClass: 'text-red-600' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">COD Summary (This Month)</h3>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded shrink-0"
          >
            View All
          </button>
        )}
      </div>

      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <dt className="text-xs font-medium text-slate-500 truncate">{row.label}</dt>
            <dd className={`text-xs font-bold shrink-0 ${row.valueClass}`}>
              {formatCurrency(row.value, currency)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
