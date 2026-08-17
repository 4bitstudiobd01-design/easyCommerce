'use client';

import React from 'react';
import { Globe, Store, Package, CreditCard, CheckCircle2 } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';
import { useGetPublicPlatformStatsQuery } from '../../api/adminApi';

export interface PublicStatsWidgetProps {
  className?: string;
}

function formatCompactBdt(value: number): string {
  if (value >= 10000000) return `৳ ${(value / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (value >= 100000) return `৳ ${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (value >= 1000) return `৳ ${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `৳ ${value.toLocaleString('en-IN')}`;
}

/**
 * Mirrors the figures published on the public landing page, so an admin can see
 * exactly what anonymous visitors are shown without leaving the dashboard.
 */
export function PublicStatsWidget({ className = '' }: PublicStatsWidgetProps) {
  const { data, isLoading, isError, error, refetch } = useGetPublicPlatformStatsQuery();

  const items = [
    {
      id: 'stores',
      label: 'Active stores',
      value: data ? data.activeStoresCount.toLocaleString('en-IN') : '—',
      icon: Store,
    },
    {
      id: 'orders',
      label: 'Orders processed',
      value: data ? data.totalOrdersCount.toLocaleString('en-IN') : '—',
      icon: Package,
    },
    {
      id: 'value',
      label: 'Order value',
      value: data ? formatCompactBdt(data.totalOrderValue) : '—',
      icon: CreditCard,
    },
    {
      id: 'modules',
      label: 'Modules shipped',
      value: data ? data.modulesShipped.toLocaleString('en-IN') : '—',
      icon: CheckCircle2,
    },
  ];

  return (
    <WidgetCard
      title="Public Landing Page Figures"
      subtitle="Live totals shown to anonymous visitors"
      icon={Globe}
      iconBgColor="bg-blue-50 dark:bg-blue-950/50"
      iconTextColor="text-blue-600 dark:text-blue-400"
      isLoading={isLoading}
      isError={isError}
      error={error as { message?: string } | null}
      isEmpty={!isLoading && !isError && !data}
      onRefresh={refetch}
      className={className}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3"
            >
              <div className="p-1.5 bg-white dark:bg-slate-900 rounded-xl text-blue-600 dark:text-blue-400 border border-slate-200/50 dark:border-slate-700 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block truncate tabular-nums">
                  {item.value}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block truncate">
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500">
        Cached for one hour on the marketing site, so the landing page may lag these values.
      </p>
    </WidgetCard>
  );
}
