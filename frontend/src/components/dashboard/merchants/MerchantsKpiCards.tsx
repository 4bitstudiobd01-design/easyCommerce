'use client';

import React from 'react';
import {
  Users,
  Store,
  Hourglass,
  PauseCircle,
  UserX,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { MerchantKpiCardItem } from './types';

interface MerchantsKpiCardsProps {
  kpis: MerchantKpiCardItem[];
}

export function MerchantsKpiCards({ kpis }: MerchantsKpiCardsProps) {
  const getIcon = (type: MerchantKpiCardItem['iconType']) => {
    const iconClass = 'w-5 h-5 text-emerald-600 stroke-[2]';
    switch (type) {
      case 'users':
        return <Users className={iconClass} />;
      case 'store':
        return <Store className={iconClass} />;
      case 'hourglass':
        return <Hourglass className={iconClass} />;
      case 'pause':
        return <PauseCircle className={iconClass} />;
      case 'user-minus':
        return <UserX className={iconClass} />;
      case 'user-plus':
        return <UserPlus className={iconClass} />;
      default:
        return <Users className={iconClass} />;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        // For suspended and churned, negative trend or red indicator
        const isRed = !kpi.isPositive || kpi.id === 'suspended-merchants' || kpi.id === 'churned-merchants';
        
        return (
          <div
            key={kpi.id}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            {/* Header: Icon + Title */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shrink-0">
                {getIcon(kpi.iconType)}
              </div>
              <div className="min-w-0">
                <span className="text-[12px] font-medium text-slate-500 block leading-tight truncate">
                  {kpi.title}
                </span>
                <span className="text-[22px] font-bold text-slate-900 tracking-tight leading-snug block mt-0.5">
                  {kpi.value}
                </span>
              </div>
            </div>

            {/* Subtitle / Trend change */}
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
