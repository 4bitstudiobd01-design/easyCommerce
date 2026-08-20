'use client';

import React from 'react';
import { GATEWAY_REVENUE_DATA } from './transactionsMockData';

export function RevenueByGatewayCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
        Revenue by Gateway (This Month)
      </h3>

      <div className="space-y-3.5 text-xs">
        {GATEWAY_REVENUE_DATA.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{item.name}</span>
              <span className="font-bold text-slate-900">
                {item.amount}{' '}
                <span className="text-slate-400 font-normal text-[11px]">
                  ({item.percentage}%)
                </span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
