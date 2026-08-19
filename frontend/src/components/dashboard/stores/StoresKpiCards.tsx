'use client';

import React from 'react';
import {
  Store,
  CheckCircle2,
  PauseCircle,
  ShieldAlert,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StoreKpiCardItem } from './types';

interface StoresKpiCardsProps {
  kpis: StoreKpiCardItem[];
}

export function StoresKpiCards({ kpis }: StoresKpiCardsProps) {
  const getIcon = (type: StoreKpiCardItem['iconType']) => {
    switch (type) {
      case 'total-stores':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50/90 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Store className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'active-stores':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50/90 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'suspended-stores':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50/90 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <PauseCircle className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'blocked-stores':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50/90 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'new-stores':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50/90 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <PlusCircle className="w-5 h-5 stroke-[2]" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50/90 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Store className="w-5 h-5 stroke-[2]" />
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        const isRed =
          !kpi.isPositive ||
          kpi.id === 'suspended-stores' ||
          kpi.id === 'blocked-stores';

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
                <span className="text-[22px] font-bold text-slate-900 tracking-tight leading-snug block mt-0.5">
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
