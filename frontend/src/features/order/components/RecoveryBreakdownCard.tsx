'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AbandonedCartSummary } from '../utils/abandonedCartMetrics';

interface RecoveryBreakdownCardProps {
  summary: AbandonedCartSummary;
  totalCarts: number;
  isLoading: boolean;
}

interface BreakdownRow {
  key: string;
  label: string;
  count: number;
  barClass: string;
  dotClass: string;
}

export const RecoveryBreakdownCard = ({
  summary,
  totalCarts,
  isLoading,
}: RecoveryBreakdownCardProps) => {
  // "Reminded" counts only carts still open — a recovered cart is reported once,
  // under Recovered, so the three rows always sum to the total.
  const remindedNotRecovered = Math.max(0, summary.remindedCarts - summary.recoveredCarts);
  const notContacted = Math.max(
    0,
    totalCarts - summary.recoveredCarts - remindedNotRecovered,
  );

  const rows: BreakdownRow[] = [
    {
      key: 'recovered',
      label: 'Recovered',
      count: summary.recoveredCarts,
      barClass: 'bg-emerald-500',
      dotClass: 'bg-emerald-500',
    },
    {
      key: 'reminded',
      label: 'Reminded',
      count: remindedNotRecovered,
      barClass: 'bg-teal-500',
      dotClass: 'bg-teal-500',
    },
    {
      key: 'notContacted',
      label: 'Not contacted',
      count: notContacted,
      barClass: 'bg-amber-500',
      dotClass: 'bg-amber-500',
    },
  ];

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xs font-extrabold text-slate-900">Recovery Breakdown</h2>
        <span className="text-[10px] font-bold text-slate-400">
          {totalCarts.toLocaleString('en-US')} total
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="space-y-1.5">
              <Skeleton className="h-2.5 w-24 rounded" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : totalCarts === 0 ? (
        <p className="text-[11px] font-medium text-slate-400 py-4 text-center">
          Nothing to break down yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const percent = totalCarts > 0 ? (row.count / totalCarts) * 100 : 0;
            return (
              <div key={row.key}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${row.dotClass} shrink-0`}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                      {row.label}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 shrink-0">
                    {row.count.toLocaleString('en-US')}
                    <span className="text-slate-400 font-medium ml-1">
                      ({percent.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.barClass}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
