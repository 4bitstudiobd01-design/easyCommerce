'use client';

import React from 'react';
import { Edit3, CircleDollarSign, PlusCircle } from 'lucide-react';
import { PLAN_RECENT_CHANGES } from './plansMockData';

export function RecentChangesCard() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'edit':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Edit3 className="w-4 h-4" />
          </div>
        );
      case 'price':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CircleDollarSign className="w-4 h-4" />
          </div>
        );
      case 'create':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Edit3 className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
      <h3 className="text-sm font-bold text-slate-900 mb-4">
        Recent Changes
      </h3>

      <div className="space-y-3.5">
        {PLAN_RECENT_CHANGES.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-3 min-w-0">
              {getIcon(item.iconType)}
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 block truncate">
                  {item.title}
                </span>
                <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">
                  {item.description}
                </span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 shrink-0 font-medium whitespace-nowrap">
              {item.timeAgo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
