'use client';

import React from 'react';
import {
  CreditCard,
  Hourglass,
  RotateCcw,
  XCircle,
  CircleDollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { SubscriptionKpiCardItem } from './types';

interface SubscriptionKpiCardsProps {
  kpis: SubscriptionKpiCardItem[];
}

export function SubscriptionKpiCards({ kpis }: SubscriptionKpiCardsProps) {
  const getIcon = (type: SubscriptionKpiCardItem['iconType']) => {
    switch (type) {
      case 'active':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CreditCard className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'trial':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Hourglass className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'expired':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <RotateCcw className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'cancelled':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <XCircle className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'mrr':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CircleDollarSign className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'arr':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2]" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CreditCard className="w-5 h-5 stroke-[2]" />
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        const isRed =
          !kpi.isPositive ||
          kpi.id === 'trial-subscriptions' ||
          kpi.id === 'cancelled';

        return (
          <div
            key={kpi.id}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            {/* Top Row: Icon + Title & Value */}
            <div className="flex items-start gap-3">
              {getIcon(kpi.iconType)}
              <div className="min-w-0">
                <span className="text-[12px] font-medium text-slate-500 block leading-tight truncate">
                  {kpi.title}
                </span>
                <span className="text-[20px] 2xl:text-[22px] font-bold text-slate-900 tracking-tight leading-snug block mt-0.5 truncate">
                  {kpi.value}
                </span>
              </div>
            </div>

            {/* Bottom Row: Trend & Period */}
            <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center gap-1.5 text-[11px]">
              {isRed ? (
                <span className="font-semibold text-rose-600 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {kpi.change}
                </span>
              ) : (
                <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {kpi.change}
                </span>
              )}
              <span className="text-slate-400 font-normal truncate">{kpi.period}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
