'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  CircleDollarSign,
  Zap,
} from 'lucide-react';
import { PLAN_HIGHLIGHTS } from './plansMockData';

export function PlanHighlightsCard() {
  const getIcon = (tagColor: string) => {
    switch (tagColor) {
      case 'green':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'blue':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'amber':
        return <CircleDollarSign className="w-4 h-4 text-amber-600" />;
      case 'purple':
        return <Zap className="w-4 h-4 text-purple-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getCardStyles = (tagColor: string) => {
    switch (tagColor) {
      case 'green':
        return 'bg-emerald-50/40 border-emerald-100/80 text-emerald-700';
      case 'blue':
        return 'bg-blue-50/40 border-blue-100/80 text-blue-700';
      case 'amber':
        return 'bg-amber-50/40 border-amber-100/80 text-amber-700';
      case 'purple':
        return 'bg-purple-50/40 border-purple-100/80 text-purple-700';
      default:
        return 'bg-emerald-50/40 border-emerald-100/80 text-emerald-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
      <h3 className="text-sm font-bold text-slate-900 mb-4">
        Plan Highlights
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {PLAN_HIGHLIGHTS.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border ${getCardStyles(
              item.tagColor
            )} flex flex-col justify-between space-y-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {item.tag}
              </span>
              {getIcon(item.tagColor)}
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block">
                {item.planName}
              </span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">
                {item.statValue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
