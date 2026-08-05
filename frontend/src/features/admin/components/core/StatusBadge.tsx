import React from 'react';

export type StatusVariant = 'operational' | 'active' | 'suspended' | 'warning' | 'error' | 'neutral';

export interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const configs: Record<StatusVariant, { bg: string; text: string; border: string; dotBg: string; defaultLabel: string }> = {
    operational: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      dotBg: 'bg-emerald-500 animate-pulse',
      defaultLabel: 'Operational',
    },
    active: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      dotBg: 'bg-emerald-500',
      defaultLabel: 'Active',
    },
    suspended: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      dotBg: 'bg-red-500',
      defaultLabel: 'Suspended',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      dotBg: 'bg-amber-500',
      defaultLabel: 'Degraded',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      dotBg: 'bg-rose-500',
      defaultLabel: 'Outage',
    },
    neutral: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      dotBg: 'bg-slate-400',
      defaultLabel: 'Inactive',
    },
  };

  const config = configs[status] || configs.neutral;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold tracking-tight ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotBg}`} />
      <span>{displayLabel}</span>
    </span>
  );
}
