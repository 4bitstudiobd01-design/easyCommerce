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
  compact?: boolean;
}

export function WidgetCard({
  title,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconTextColor = 'text-blue-600',
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
  compact = false,
}: WidgetCardProps) {
  // Compact mode for merchant dashboard — tighter chrome
  const containerClass = compact
    ? `bg-white rounded-xl border border-blue-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between ${className}`
    : `bg-white backdrop-blur-xl rounded-3xl border border-blue-100 p-6 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between ${className}`;

  const headerClass = compact
    ? 'flex items-start justify-between gap-2 border-b border-blue-50 pb-2.5'
    : 'flex items-start justify-between gap-3 border-b border-blue-50 pb-4';

  const iconContainerClass = compact
    ? `p-1.5 rounded-lg ${iconBgColor} ${iconTextColor} shrink-0`
    : `p-2.5 rounded-2xl ${iconBgColor} ${iconTextColor} border border-blue-100 shrink-0 shadow-sm`;

  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';
  const titleClass = compact
    ? 'text-base font-bold text-slate-900 tracking-tight leading-snug'
    : 'text-base font-black text-blue-950 tracking-tight leading-snug';
  const subtitleClass = compact
    ? 'text-xs text-slate-500 mt-0.5 font-medium'
    : 'text-xs text-slate-500 mt-0.5 font-medium';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className={compact ? 'space-y-2' : 'space-y-4'}>
        <div className={headerClass}>
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={iconContainerClass}>
                <Icon className={iconSize} />
              </div>
            )}
            <div>
              <h3 className={titleClass}>
                {title}
              </h3>
              {subtitle && (
                <p className={subtitleClass}>{subtitle}</p>
              )}
            </div>
          </div>

          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>

        {/* Card Body State Handling */}
        {isLoading ? (
          <div className={compact ? 'space-y-2 py-1' : 'space-y-3 py-2'}>
            <Skeleton className="h-8 w-2/3 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-lg" />
            {!compact && <Skeleton className="h-4 w-4/5 rounded-lg" />}
          </div>
        ) : isError ? (
          <div className={compact ? 'py-4 px-3 bg-blue-50 rounded-xl border border-blue-100 text-center space-y-2' : 'py-6 px-4 bg-blue-50 rounded-2xl border border-blue-100 text-center space-y-3'}>
            <AlertCircle className={compact ? 'w-6 h-6 text-blue-500 mx-auto' : 'w-8 h-8 text-blue-500 mx-auto'} />
            <div>
              <h4 className="text-xs font-extrabold text-blue-800">Failed to load widget data</h4>
              <p className="text-[11px] text-blue-600 mt-1 font-medium">
                {error?.message || 'An unexpected error occurred while fetching data.'}
              </p>
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className={compact ? 'py-4 px-3 text-center space-y-1.5' : 'py-8 px-4 text-center space-y-2'}>
            <Inbox className={compact ? 'w-6 h-6 text-blue-300 mx-auto' : 'w-8 h-8 text-blue-300 mx-auto'} />
            <h4 className="text-xs font-extrabold text-blue-800">{emptyTitle}</h4>
            <p className="text-[11px] text-blue-400 max-w-xs mx-auto font-medium">{emptyDescription}</p>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>

      {/* Footer */}
      {(footer || lastUpdated || onRefresh) && (
        <div className={compact ? 'mt-3 pt-2 border-t border-blue-50 flex items-center justify-between text-[10px] text-blue-500 font-semibold' : 'mt-4 pt-3 border-t border-blue-50 flex items-center justify-between text-[11px] text-blue-500 font-semibold'}>
          <div>{footer}</div>
          <div className="flex items-center gap-2 ml-auto">
            {lastUpdated && (
              <span className="inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 text-[10px] text-blue-600">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>Updated {lastUpdated}</span>
              </span>
            )}
            {onRefresh && !isLoading && (
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh Widget"
                className="p-1.5 hover:bg-blue-50 rounded-xl text-blue-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

