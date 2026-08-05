import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTrend } from './StatTrend';

export interface MetricCardProps {
  label: string;
  value?: string | number;
  unit?: string;
  trendPercent?: number;
  trendLabel?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  trendPercent,
  trendLabel,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50 dark:bg-blue-950/50',
  iconTextColor = 'text-blue-600 dark:text-blue-400',
  isLoading = false,
  isError = false,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
          {label}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBgColor} ${iconTextColor} border border-slate-200/50 dark:border-slate-800 shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : isError ? (
          <span className="text-xs font-bold text-red-500">Failed to load</span>
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {value ?? '—'}
              </span>
              {unit && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{unit}</span>}
            </div>

            {trendPercent !== undefined && (
              <div className="pt-1">
                <StatTrend value={trendPercent} periodLabel={trendLabel} />
              </div>
            )}

            {subtitle && !trendPercent && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
