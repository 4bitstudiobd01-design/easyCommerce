import React from 'react';
import { LucideIcon, RefreshCw, AlertCircle, Inbox, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export interface WidgetCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  lastUpdated?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRefresh?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function WidgetCard({
  title,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50 dark:bg-blue-950/50',
  iconTextColor = 'text-blue-600 dark:text-blue-400',
  headerAction,
  footer,
  lastUpdated,
  isLoading = false,
  isError = false,
  error,
  isEmpty = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There is no information to display for this timeframe.',
  onRefresh,
  className = '',
  children,
}: WidgetCardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2.5 rounded-xl ${iconBgColor} ${iconTextColor} border border-slate-200/50 dark:border-slate-800 shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{subtitle}</p>
              )}
            </div>
          </div>

          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>

        {/* Card Body State Handling */}
        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : isError ? (
          <div className="py-6 px-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/60 dark:border-red-900/40 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <div>
              <h4 className="text-xs font-bold text-red-700 dark:text-red-400">Failed to load widget data</h4>
              <p className="text-[11px] text-red-600/80 dark:text-red-400/70 mt-1">
                {error?.message || 'An unexpected error occurred while fetching data.'}
              </p>
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="py-8 px-4 text-center space-y-2">
            <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{emptyTitle}</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto font-medium">{emptyDescription}</p>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>

      {/* Footer */}
      {(footer || lastUpdated || onRefresh) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div>{footer}</div>
          <div className="flex items-center gap-2 ml-auto">
            {lastUpdated && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Updated {lastUpdated}</span>
              </span>
            )}
            {onRefresh && !isLoading && (
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh Widget"
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
