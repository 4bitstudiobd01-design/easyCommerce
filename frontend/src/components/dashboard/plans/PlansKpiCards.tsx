'use client';

import React from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  UserCheck,
  CircleDollarSign,
} from 'lucide-react';
import { PlanKpiItem } from './types';

interface PlansKpiCardsProps {
  kpis: PlanKpiItem[];
}

export function PlansKpiCards({ kpis }: PlansKpiCardsProps) {
  const getIcon = (type: PlanKpiItem['iconType']) => {
    switch (type) {
      case 'total':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Layers className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'active':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'inactive':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'popular':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <UserCheck className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'mrr':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CircleDollarSign className="w-5 h-5 stroke-[2]" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Layers className="w-5 h-5 stroke-[2]" />
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        const isAmber = kpi.iconType === 'inactive';
        const isPurple = kpi.iconType === 'popular';

        return (
          <div
            key={kpi.id}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
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

            {/* Bottom Row: Dot Subtext */}
            <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center gap-1.5 text-[11px] text-slate-400">
              {isPurple ? (
                <span className="text-slate-500 font-medium truncate">{kpi.subtext}</span>
              ) : isAmber ? (
                <span className="flex items-center gap-1.5 text-amber-500 font-medium truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {kpi.subtext}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {kpi.subtext}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
