'use client';

import React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { FAILED_PAYMENTS } from './subscriptionMockData';

export function FailedPaymentsCard() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-[13px] font-bold text-slate-900">
            Last Failed Payments
          </h3>
          <button
            type="button"
            className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {FAILED_PAYMENTS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full ${item.avatarBg} text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block truncate">
                    {item.storeName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {item.subId}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-slate-900 block">
                  {item.amount}
                </span>
                <span className="inline-block text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded mt-0.5">
                  Failed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 text-center">
        <button
          type="button"
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View All Failed Payments</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
