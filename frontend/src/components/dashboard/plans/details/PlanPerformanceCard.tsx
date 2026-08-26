'use client';

import React from 'react';
import {
  Users,
  CreditCard,
  AlertCircle,
  TrendingUp,
  LineChart,
} from 'lucide-react';
import { PlanRecord } from '../types';
import { toast } from 'sonner';

interface PlanPerformanceCardProps {
  plan: PlanRecord;
  onOpenAnalytics?: () => void;
}

export function PlanPerformanceCard({
  plan,
  onOpenAnalytics,
}: PlanPerformanceCardProps) {
  const perf = plan.performance || {
    merchants: 842,
    merchantsGrowth: '18.3%',
    newSubscriptions: 128,
    newSubscriptionsGrowth: '15.7%',
    cancelled: 14,
    cancelledGrowth: '12.5%',
    mrr: plan.mrr || '৳9,80,000',
    mrrGrowth: '19.6%',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
        Plan Performance (Last 30 Days)
      </h3>

      <div className="space-y-3.5">
        {/* Total Merchants */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-slate-700">Total Merchants</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{perf.merchants}</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              ↑ {perf.merchantsGrowth}
            </span>
          </div>
        </div>

        {/* New Subscriptions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-slate-700">New Subscriptions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{perf.newSubscriptions}</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              ↑ {perf.newSubscriptionsGrowth}
            </span>
          </div>
        </div>

        {/* Cancelled */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-slate-700">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{perf.cancelled}</span>
            <span className="text-[11px] font-semibold text-amber-600 flex items-center">
              ↓ {perf.cancelledGrowth}
            </span>
          </div>
        </div>

        {/* MRR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <LineChart className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-slate-700">MRR</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{perf.mrr}</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              ↑ {perf.mrrGrowth}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (onOpenAnalytics) {
            onOpenAnalytics();
          } else {
            toast.info(`Opening analytics report for ${plan.name} plan`);
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
      >
        <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
        <span>View Analytics Report</span>
      </button>
    </div>
  );
}
