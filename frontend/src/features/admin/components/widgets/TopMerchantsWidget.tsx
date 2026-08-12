'use client';

import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';
import { StatusBadge } from '../core/StatusBadge';

export interface TopMerchantItem {
  id: string;
  name: string;
  slug: string;
  revenueBdt: number;
  ordersCount: number;
  growthPercent: number;
}

export interface TopMerchantsWidgetProps {
  merchants?: TopMerchantItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

export function TopMerchantsWidget({
  merchants = [],
  isLoading = false,
  isError = false,
  error,
  lastUpdated,
  onRefresh,
  className = '',
}: TopMerchantsWidgetProps) {
  return (
    <WidgetCard
      title="Top Performing Merchants"
      subtitle="Highest revenue generating tenant stores"
      icon={Trophy}
      iconBgColor="bg-amber-50 dark:bg-amber-950/50"
      iconTextColor="text-amber-600 dark:text-amber-400"
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={!merchants || merchants.length === 0}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {merchants.map((merchant, idx) => (
          <div key={merchant.id} className="py-3 flex items-center justify-between gap-3 text-xs font-semibold first:pt-0 last:pb-0">
            <div className="flex items-center gap-3 truncate">
              <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                #{idx + 1}
              </div>
              <div className="truncate">
                <span className="font-extrabold text-slate-900 dark:text-white block truncate">{merchant.name}</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block truncate">{merchant.slug}.easycommerce.app</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs block">
                ৳{merchant.revenueBdt.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {merchant.ordersCount} orders (+{merchant.growthPercent}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
