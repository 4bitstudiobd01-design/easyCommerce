import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({
  title = 'Failed to load content',
  message = 'An unexpected error occurred while processing your request.',
  onRetry,
  className = '',
}: ErrorCardProps) {
  return (
    <div
      className={`p-8 bg-red-50/50 dark:bg-red-950/20 rounded-3xl border border-red-200/80 dark:border-red-900/40 text-center space-y-4 ${className}`}
    >
      <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-2xl text-red-600 dark:text-red-400 w-fit mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-extrabold text-red-900 dark:text-red-200">{title}</h4>
        <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1 max-w-sm mx-auto">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

export interface EmptyStateCardProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateCard({
  title = 'No Data Found',
  description = 'There are no records matching the selected parameters.',
  actionText,
  onAction,
  className = '',
}: EmptyStateCardProps) {
  return (
    <div className={`p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 ${className}`}>
      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
