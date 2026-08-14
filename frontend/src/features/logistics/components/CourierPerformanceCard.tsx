'use client';

import React from 'react';
import { Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CourierPerformance } from '../api/logisticsApi';
import { getCourierBrandStyle } from '../utils/shipmentFormatters';

interface CourierPerformanceCardProps {
  couriers?: CourierPerformance[];
  isLoading: boolean;
  periodLabel: string;
  onViewAll: () => void;
}

/** Success rate drives the bar colour, but the number is always shown too. */
const barColor = (successRate: number): string => {
  if (successRate >= 90) return 'bg-emerald-500';
  if (successRate >= 80) return 'bg-blue-500';
  if (successRate >= 70) return 'bg-amber-500';
  return 'bg-red-500';
};

export const CourierPerformanceCard = ({
  couriers,
  isLoading,
  periodLabel,
  onViewAll,
}: CourierPerformanceCardProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
        <Skeleton className="h-4 w-40 rounded mb-5" />
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rows = couriers ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Courier Performance {periodLabel}</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded shrink-0"
        >
          View All
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs font-medium text-slate-400 py-4 text-center">
          No courier activity in this period.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((courier) => (
            <li key={courier.provider}>
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${getCourierBrandStyle(
                    courier.provider,
                  )}`}
                  aria-hidden="true"
                >
                  <Truck className="w-3.5 h-3.5" strokeWidth={2.25} />
                </div>
                <span className="text-xs font-bold text-slate-900 truncate flex-1">
                  {courier.name}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-medium text-slate-500">
                  Deliveries{' '}
                  <span className="font-bold text-slate-700">
                    {courier.deliveries.toLocaleString('en-US')}
                  </span>
                </span>
                <span className="font-medium text-slate-500">
                  Success Rate{' '}
                  <span className="font-bold text-slate-700">{courier.successRate}%</span>
                </span>
              </div>

              <div
                className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={courier.successRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${courier.name} success rate`}
              >
                <div
                  className={`h-full rounded-full transition-all ${barColor(courier.successRate)}`}
                  style={{ width: `${Math.min(100, Math.max(0, courier.successRate))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
