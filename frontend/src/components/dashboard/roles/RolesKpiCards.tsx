'use client';

import React from 'react';
import { Shield, Lock, Users, Key, TrendingUp } from 'lucide-react';
import { RoleKpiMetric } from './types';
import { ROLES_KPIS } from './rolesMockData';

interface RolesKpiCardsProps {
  kpis?: RoleKpiMetric[];
  onKpiClick?: (type: RoleKpiMetric['type']) => void;
}

export function RolesKpiCards({
  kpis = ROLES_KPIS,
  onKpiClick,
}: RolesKpiCardsProps) {
  const getIconAndStyle = (type: RoleKpiMetric['type']) => {
    switch (type) {
      case 'roles':
        return {
          icon: <Shield className="w-5 h-5 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-100',
        };
      case 'permissions':
        return {
          icon: <Lock className="w-5 h-5 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-100',
        };
      case 'users':
        return {
          icon: <Users className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-100',
        };
      case 'groups':
        return {
          icon: <Key className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-100',
        };
      default:
        return {
          icon: <Shield className="w-5 h-5 text-slate-600" />,
          bg: 'bg-slate-50 border-slate-100',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        const { icon, bg } = getIconAndStyle(kpi.type);

        return (
          <div
            key={kpi.id}
            onClick={() => onKpiClick?.(kpi.type)}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              {/* Icon Box */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${bg}`}
              >
                {icon}
              </div>

              {/* Title & Count */}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-500 block truncate">
                  {kpi.title}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight block leading-tight mt-0.5">
                  {kpi.value}
                </span>
              </div>
            </div>

            {/* Growth Trend */}
            <div className="mt-3.5 flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
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
