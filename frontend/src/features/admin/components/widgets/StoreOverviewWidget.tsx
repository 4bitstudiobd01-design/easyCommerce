import React from 'react';
import { Building2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';

export interface StoreOverviewData {
  totalStores: number;
  activeStores: number;
  trialStores: number;
  suspendedStores: number;
}

export interface StoreOverviewWidgetProps {
  data?: StoreOverviewData;
  isLoading?: boolean;
  isError?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultStoreData: StoreOverviewData = {
  totalStores: 1420,
  activeStores: 1310,
  trialStores: 85,
  suspendedStores: 25,
};

export function StoreOverviewWidget({
  data = defaultStoreData,
  isLoading = false,
  isError = false,
  lastUpdated,
  onRefresh,
  className = '',
}: StoreOverviewWidgetProps) {
  return (
    <WidgetCard
      title="Tenant Stores Overview"
      subtitle="Registered store subdomains status"
      icon={Building2}
      iconBgColor="bg-blue-50 dark:bg-blue-950/50"
      iconTextColor="text-blue-600 dark:text-blue-400"
      isLoading={isLoading}
      isError={isError}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total</span>
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white block">
            {data.totalStores.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">Subdomains</span>
        </div>

        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Active</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 block">
            {data.activeStores.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 font-medium block">Live Websites</span>
        </div>

        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">In Trial</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-amber-700 dark:text-amber-300 block">
            {data.trialStores.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70 font-medium block">14-Day Free</span>
        </div>

        <div className="p-3.5 bg-red-50/50 dark:bg-red-950/30 rounded-2xl border border-red-100 dark:border-red-900/40 space-y-1">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Suspended</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-red-700 dark:text-red-300 block">
            {data.suspendedStores.toLocaleString()}
          </span>
          <span className="text-[10px] text-red-600/80 dark:text-red-400/70 font-medium block">Disabled</span>
        </div>
      </div>
    </WidgetCard>
  );
}
