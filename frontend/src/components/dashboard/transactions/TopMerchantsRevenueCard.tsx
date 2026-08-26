'use client';

import React from 'react';
import { TOP_MERCHANTS_REVENUE } from './transactionsMockData';
import { toast } from 'sonner';

export function TopMerchantsRevenueCard() {
  const getBadgeBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-emerald-100 text-emerald-800';
      case 2:
        return 'bg-rose-100 text-rose-800';
      case 3:
        return 'bg-amber-100 text-amber-800';
      case 4:
        return 'bg-teal-100 text-teal-800';
      case 5:
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header with View All link */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
          Top Merchants by Revenue
        </h3>
        <button
          type="button"
          onClick={() => toast.info('Viewing all merchants')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* List */}
      <div className="space-y-3 text-xs">
        {TOP_MERCHANTS_REVENUE.map((m) => (
          <div key={m.rank} className="flex items-center justify-between gap-3">
            {/* Rank badge + Merchant name + transaction count */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${getBadgeBg(
                  m.rank
                )}`}
              >
                {m.rank}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block truncate">
                  {m.name}
                </span>
                <span className="text-[11px] text-slate-400 font-normal block truncate">
                  {m.transactionCount}
                </span>
              </div>
            </div>

            {/* Amount */}
            <span className="font-bold text-slate-900 shrink-0">
              {m.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
