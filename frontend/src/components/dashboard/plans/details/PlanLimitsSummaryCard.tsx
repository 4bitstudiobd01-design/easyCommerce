'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { PlanRecord } from '../types';

interface PlanLimitsSummaryCardProps {
  plan: PlanRecord;
}

export function PlanLimitsSummaryCard({ plan }: PlanLimitsSummaryCardProps) {
  const limits = plan.limitsSummary || {
    stores: 5,
    products: '10,000',
    staffAccounts: 10,
    monthlyOrders: '2,000',
    storage: '50 GB',
    bandwidth: '200 GB / month',
    emailSends: '10,000 / month',
    customDomain: true,
    apiAccess: true,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
        Plan Limits Summary
      </h3>

      <div className="space-y-2.5 text-xs">
        {/* Stores */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
          <span className="text-slate-500 font-medium">Stores</span>
          <span className="font-bold text-slate-900">{limits.stores}</span>
        </div>

        {/* Products */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
          <span className="text-slate-500 font-medium">Products</span>
          <span className="font-bold text-slate-900">{limits.products}</span>
        </div>

        {/* Staff Accounts */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
          <span className="text-slate-500 font-medium">Staff Accounts</span>
          <span className="font-bold text-slate-900">{limits.staffAccounts}</span>
        </div>

        {/* Monthly Orders */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
          <span className="text-slate-500 font-medium">Monthly Orders</span>
          <span className="font-bold text-slate-900">{limits.monthlyOrders}</span>
        </div>

        {/* Storage */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
          <span className="text-slate-500 font-medium">Storage</span>
          <span className="font-bold text-slate-900">{limits.storage}</span>
        </div>

        {/* Bandwidth */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
          <span className="text-slate-500 font-medium">Bandwidth</span>
          <span className="font-bold text-slate-900">{limits.bandwidth}</span>
        </div>

        {/* Email Sends */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
          <span className="text-slate-500 font-medium">Email Sends</span>
          <span className="font-bold text-slate-900">{limits.emailSends}</span>
        </div>

        {/* Custom Domain */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
          <span className="text-slate-500 font-medium">Custom Domain</span>
          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>

        {/* API Access */}
        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500 font-medium">API Access</span>
          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>
      </div>
    </div>
  );
}
