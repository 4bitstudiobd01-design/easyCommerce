'use client';

import React from 'react';
import { Key, ShieldCheck, Layers, FolderClosed } from 'lucide-react';
import { PermissionKpiMetric } from './types';
import { PERMISSIONS_KPIS } from './permissionsMockData';

interface PermissionsKpiCardsProps {
  kpis?: PermissionKpiMetric[];
  activeFilter?: string;
  onKpiClick?: (type: PermissionKpiMetric['type']) => void;
}

export function PermissionsKpiCards({
  kpis = PERMISSIONS_KPIS,
  activeFilter,
  onKpiClick,
}: PermissionsKpiCardsProps) {
  const getIconAndStyle = (type: PermissionKpiMetric['type']) => {
    switch (type) {
      case 'total':
        return {
          icon: <Key className="w-5 h-5 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-100',
        };
      case 'system':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-100',
        };
      case 'custom':
        return {
          icon: <Layers className="w-5 h-5 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-100',
        };
      case 'modules':
        return {
          icon: <FolderClosed className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-100',
        };
      default:
        return {
          icon: <Key className="w-5 h-5 text-slate-600" />,
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

            {/* Subtitle description */}
            <div className="mt-3 text-[11px] text-slate-400 font-medium truncate">
              {kpi.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
