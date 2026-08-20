'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CreatePlanFormData } from '../types';

interface PlanQuickSummaryCardProps {
  formData: CreatePlanFormData;
  onScrollToLimits?: () => void;
}

export function PlanQuickSummaryCard({
  formData,
  onScrollToLimits,
}: PlanQuickSummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5 text-xs">
      <h3 className="font-bold text-slate-900 tracking-tight">Quick Summary</h3>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Billing Cycle</span>
          <span className="font-bold text-slate-900">{formData.billingCycle}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Monthly Price</span>
          <span className="font-bold text-slate-900">৳{formData.price || '0'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Yearly Price</span>
          <span className="font-bold text-slate-900">৳{formData.yearlyPrice || '0'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Yearly Discount</span>
          <span className="font-bold text-slate-900">
            {formData.offerYearlyDiscount ? `${formData.yearlyDiscountPercent}%` : '0%'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Stores</span>
          <span className="font-bold text-slate-900">{formData.stores}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Products</span>
          <span className="font-bold text-slate-900">{formData.products}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onScrollToLimits}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors mx-auto"
        >
          <span>View Plan Limits</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
