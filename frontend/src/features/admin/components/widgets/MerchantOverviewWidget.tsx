import React from 'react';
import { Users, UserCheck, UserPlus, UserX } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';
import { MetricCard } from '../core/MetricCard';

export interface MerchantOverviewData {
  totalMerchants: number;
  activeMerchants: number;
  newMerchantsThisMonth: number;
  suspendedMerchants: number;
}

export interface MerchantOverviewWidgetProps {
  data?: MerchantOverviewData;
  isLoading?: boolean;
  isError?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultMerchantData: MerchantOverviewData = {
  totalMerchants: 1250,
  activeMerchants: 1180,
  newMerchantsThisMonth: 45,
  suspendedMerchants: 25,
};

export function MerchantOverviewWidget({
  data = defaultMerchantData,
  isLoading = false,
  isError = false,
  lastUpdated,
  onRefresh,
  className = '',
}: MerchantOverviewWidgetProps) {
  return (
    <WidgetCard
      title="Merchant Account Directory"
      subtitle="Registered merchant accounts overview"
      icon={Users}
      iconBgColor="bg-purple-50 dark:bg-purple-950/50"
      iconTextColor="text-purple-600 dark:text-purple-400"
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
            <Users className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white block">
            {data.totalMerchants.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">All SaaS Accounts</span>
        </div>

        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Active</span>
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 block">
            {data.activeMerchants.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 font-medium block">Operational</span>
        </div>

        <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-1">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">New (30d)</span>
            <UserPlus className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-blue-700 dark:text-blue-300 block">
            +{data.newMerchantsThisMonth.toLocaleString()}
          </span>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/70 font-medium block">Onboarded</span>
        </div>

        <div className="p-3.5 bg-red-50/50 dark:bg-red-950/30 rounded-2xl border border-red-100 dark:border-red-900/40 space-y-1">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Suspended</span>
            <UserX className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-red-700 dark:text-red-300 block">
            {data.suspendedMerchants.toLocaleString()}
          </span>
          <span className="text-[10px] text-red-600/80 dark:text-red-400/70 font-medium block">Blocked</span>
        </div>
      </div>
    </WidgetCard>
  );
}
