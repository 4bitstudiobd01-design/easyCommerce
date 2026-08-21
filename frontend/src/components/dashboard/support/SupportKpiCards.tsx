'use client';

import React from 'react';
import {
  Ticket,
  Inbox,
  Clock,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { SupportKpiMetric } from './types';

interface SupportKpiCardsProps {
  kpis: SupportKpiMetric[];
  activeFilter?: string;
  onKpiClick?: (type: string) => void;
}

export function SupportKpiCards({
  kpis,
  activeFilter,
  onKpiClick,
}: SupportKpiCardsProps) {
  const getIconAndStyle = (type: SupportKpiMetric['type']) => {
    switch (type) {
      case 'total':
        return {
          icon: <Ticket className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-100',
        };
      case 'open':
        return {
          icon: <Inbox className="w-5 h-5 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-100',
        };
      case 'in_progress':
        return {
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-100',
        };
      case 'pending':
        return {
          icon: <UserCheck className="w-5 h-5 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-100',
        };
      case 'resolved':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-rose-500" />,
          bg: 'bg-rose-50 border-rose-100',
        };
      default:
        return {
          icon: <Ticket className="w-5 h-5 text-slate-600" />,
          bg: 'bg-slate-50 border-slate-100',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        const { icon, bg } = getIconAndStyle(kpi.type);
        const isActive =
          (activeFilter === 'all' && kpi.type === 'total') ||
          (activeFilter === 'Open' && kpi.type === 'open') ||
          (activeFilter === 'In Progress' && kpi.type === 'in_progress') ||
          (activeFilter === 'Pending Merchant' && kpi.type === 'pending') ||
          (activeFilter === 'Resolved' && kpi.type === 'resolved');

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
              {/* Icon Container */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${bg}`}
              >
                {icon}
              </div>

              {/* Title & Value */}
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
                  kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {kpi.isPositive ? (
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
