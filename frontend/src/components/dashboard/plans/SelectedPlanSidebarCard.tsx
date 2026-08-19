'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PlanRecord } from './types';

interface SelectedPlanSidebarCardProps {
  plan: PlanRecord;
  onViewDetails: (plan: PlanRecord) => void;
}

export function SelectedPlanSidebarCard({
  plan,
  onViewDetails,
}: SelectedPlanSidebarCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header with Title and Active Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">
          {plan.name} Plan
        </h3>
        {plan.status === 'Active' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Inactive
          </span>
        )}
      </div>

      {/* Details Grid */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-normal">Price</span>
          <span className="font-semibold text-slate-900">
            {plan.price} <span className="text-slate-400 font-normal text-[11px]">{plan.billingPeriod}</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-normal">Billing Cycle</span>
          <span className="font-semibold text-slate-900">
            {plan.billingCycle}
          </span>
        </div>

        <div className="pt-1">
          <span className="text-slate-500 font-normal block mb-1">Description</span>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {plan.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-500 font-normal">Features</span>
          <span className="font-semibold text-slate-900">
            {plan.featuresUsed} / {plan.featuresTotal}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-normal">Merchants</span>
          <span className="font-semibold text-slate-900">
            {plan.merchantsCount}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-normal">MRR</span>
          <span className="font-semibold text-slate-900">
            {plan.mrr}
          </span>
        </div>
      </div>

      {/* View Plan Details CTA Button */}
      <button
        type="button"
        onClick={() => onViewDetails(plan)}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>View Plan Details</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
