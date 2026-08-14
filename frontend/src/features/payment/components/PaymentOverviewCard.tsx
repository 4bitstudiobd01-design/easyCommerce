'use client';

import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PaymentSummaryResponse } from '../api/paymentApi';
import { formatCurrency } from '../utils/paymentFormatters';

interface PaymentOverviewCardProps {
  summary?: PaymentSummaryResponse;
  isLoading: boolean;
}

/** Slice colours align with the status palette used across the page. */
const SLICE_COLORS: Record<string, string> = {
  Paid: '#10b981',
  Pending: '#f59e0b',
  Refunded: '#a855f7',
};

const RADIUS = 54;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const PaymentOverviewCard = ({ summary, isLoading }: PaymentOverviewCardProps) => {
  if (isLoading || !summary) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
        <Skeleton className="h-4 w-32 rounded mb-5" />
        <div className="flex justify-center mb-5">
          <Skeleton className="w-[140px] h-[140px] rounded-full" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  const slices = summary.overview ?? [];
  const total = slices.reduce((sum, slice) => sum + (slice.amount || 0), 0);

  // Lay each arc end-to-end around the ring.
  let offsetAccumulator = 0;
  const arcs = slices.map((slice) => {
    const fraction = total > 0 ? (slice.amount || 0) / total : 0;
    const arc = {
      label: slice.label,
      color: SLICE_COLORS[slice.label] ?? '#94a3b8',
      dashArray: `${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      dashOffset: -offsetAccumulator * CIRCUMFERENCE,
    };
    offsetAccumulator += fraction;
    return arc;
  });

  const hasData = total > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Payment Overview</h3>
        <Link
          href="/dashboard/analytics"
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          View Report
        </Link>
      </div>

      <div className="flex items-center justify-center py-2">
        <div className="relative">
          <svg
            width="150"
            height="150"
            viewBox="0 0 150 150"
            role="img"
            aria-label={
              hasData
                ? `Payment breakdown: ${slices
                    .map((s) => `${s.label} ${s.percentage}%`)
                    .join(', ')}`
                : 'No payment data for this period'
            }
          >
            <circle
              cx="75"
              cy="75"
              r={RADIUS}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={STROKE}
            />
            {hasData &&
              arcs.map((arc) => (
                <circle
                  key={arc.label}
                  cx="75"
                  cy="75"
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={STROKE}
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                  transform="rotate(-90 75 75)"
                  strokeLinecap="butt"
                />
              ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(total, summary.currency)}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Total</span>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: SLICE_COLORS[slice.label] ?? '#94a3b8' }}
                aria-hidden="true"
              />
              <span className="font-medium text-slate-600 truncate">{slice.label}</span>
            </span>
            <span className="flex flex-col items-end shrink-0">
              <span className="font-bold text-slate-900 leading-tight">
                {slice.percentage}%
              </span>
              <span className="text-[10px] font-medium text-slate-400 leading-tight">
                {formatCurrency(slice.amount, summary.currency)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
