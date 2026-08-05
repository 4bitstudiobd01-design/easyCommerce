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
    ? 'text-blue-500 bg-blue-50 border-blue-100'
    : isPositive
    ? 'text-blue-700 bg-blue-100 border-blue-200'
    : 'text-blue-600 bg-blue-50 border-blue-100';

  const Icon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${colorClasses} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>
        {isPositive ? '+' : ''}
        {value.toFixed(1)}%
      </span>
      {periodLabel && <span className="font-normal text-blue-400 text-[10px] ml-0.5">{periodLabel}</span>}
    </span>
  );
}
