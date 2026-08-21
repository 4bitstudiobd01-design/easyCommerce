'use client';

import React from 'react';
import {
  Users,
  ShieldCheck,
  UserX,
  Ban,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { AdminUserKpiMetric } from './types';
import { ADMIN_USERS_KPIS } from './usersMockData';

interface UsersKpiCardsProps {
  kpis?: AdminUserKpiMetric[];
  activeFilter?: string;
  onKpiClick?: (type: string) => void;
}

export function UsersKpiCards({
  kpis = ADMIN_USERS_KPIS,
  activeFilter,
  onKpiClick,
}: UsersKpiCardsProps) {
  const getIconAndStyle = (type: AdminUserKpiMetric['type']) => {
    switch (type) {
      case 'total':
        return {
          icon: <Users className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-100',
        };
      case 'active':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-100',
        };
      case 'inactive':
        return {
          icon: <UserX className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-100',
        };
      case 'suspended':
        return {
          icon: <Ban className="w-5 h-5 text-rose-500" />,
          bg: 'bg-rose-50 border-rose-100',
        };
      default:
        return {
          icon: <Users className="w-5 h-5 text-slate-600" />,
          bg: 'bg-slate-50 border-slate-100',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        const { icon, bg } = getIconAndStyle(kpi.type);
        const isActive =
          (activeFilter === 'all' && kpi.type === 'total') ||
          (activeFilter === 'Active' && kpi.type === 'active') ||
          (activeFilter === 'Inactive' && kpi.type === 'inactive') ||
          (activeFilter === 'Suspended' && kpi.type === 'suspended');

        return (
          <div
            key={kpi.id}
            onClick={() => onKpiClick?.(kpi.type)}
            className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs hover:border-slate-300 ${
              isActive
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${bg}`}
              >
                {icon}
              </div>

              {/* Title & Big Number */}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-500 block truncate">
                  {kpi.title}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight block leading-tight mt-0.5">
                  {kpi.value}
                </span>
              </div>
            </div>

            {/* Growth / Trend Indicator */}
            <div className="mt-3.5 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-bold ${
                  kpi.isNeutral
                    ? 'text-slate-400'
                    : kpi.isPositive
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {kpi.isNeutral ? (
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : kpi.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                {kpi.change}
              </span>
              <span className="text-slate-400 font-normal text-[11px] truncate">
                {kpi.periodText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
