import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatTrendProps {
  value: number;
  periodLabel?: string;
  className?: string;
}

export function StatTrend({ value, periodLabel = 'vs last month', className = '' }: StatTrendProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const colorClasses = isNeutral
    ? 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    : isPositive
    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';

  const Icon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${colorClasses} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>
        {isPositive ? '+' : ''}
        {value.toFixed(1)}%
      </span>
      {periodLabel && <span className="font-normal text-slate-400 dark:text-slate-500 text-[10px] ml-0.5">{periodLabel}</span>}
    </span>
  );
}
