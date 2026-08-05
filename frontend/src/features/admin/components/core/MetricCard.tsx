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
  compact?: boolean;
}

export function MetricCard({
  label,
  value,
  unit,
  trendPercent,
  trendLabel,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconTextColor = 'text-blue-600',
  isLoading = false,
  isError = false,
  className = '',
  compact = false,
}: MetricCardProps) {
  if (compact) {
    return (
      <div
        className={`p-3 bg-white rounded-xl border border-blue-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-200 transition-all duration-200 ${className}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
            {label}
          </span>
          {Icon && (
            <div className={`p-1.5 rounded-lg ${iconBgColor} ${iconTextColor} shrink-0`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="mt-1.5">
          {isLoading ? (
            <Skeleton className="h-6 w-20 rounded-lg" />
          ) : isError ? (
            <span className="text-xs font-bold text-red-500">Failed</span>
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-blue-950 tracking-tight leading-none">
                  {value ?? '—'}
                </span>
                {unit && <span className="text-xs font-bold text-slate-500">{unit}</span>}
              </div>
              {trendPercent !== undefined && (
                <div className="mt-1">
                  <StatTrend value={trendPercent} periodLabel={trendLabel} />
                </div>
              )}
              {subtitle && !trendPercent && (
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 bg-white backdrop-blur-xl rounded-3xl border border-blue-100 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 truncate">
          {label}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-2xl ${iconBgColor} ${iconTextColor} border border-blue-100 shrink-0 shadow-sm`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-4 w-20 rounded-lg" />
          </div>
        ) : isError ? (
          <span className="text-xs font-extrabold text-red-500">Failed to load</span>
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-blue-950 tracking-tight">
                {value ?? '—'}
              </span>
              {unit && <span className="text-xs font-extrabold text-blue-500">{unit}</span>}
            </div>

            {trendPercent !== undefined && (
              <div className="pt-1">
                <StatTrend value={trendPercent} periodLabel={trendLabel} />
              </div>
            )}

            {subtitle && !trendPercent && (
              <p className="text-[11px] text-slate-500 font-semibold">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

