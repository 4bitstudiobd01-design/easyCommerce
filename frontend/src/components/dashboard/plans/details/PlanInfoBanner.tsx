'use client';

import React from 'react';
import {
  TrendingUp,
  Send,
  Briefcase,
  Crown,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';
import { PlanRecord } from '../types';
import { toast } from 'sonner';

interface PlanInfoBannerProps {
  plan: PlanRecord;
}

export function PlanInfoBanner({ plan }: PlanInfoBannerProps) {
  const handleCopyCode = () => {
    const code = plan.code || plan.name.toUpperCase();
    navigator.clipboard.writeText(code);
    toast.success(`Copied plan code "${code}" to clipboard`);
  };

  const renderIcon = () => {
    switch (plan.iconType) {
      case 'growth':
        return <TrendingUp className="w-8 h-8 stroke-[2.2]" />;
      case 'starter':
        return <Send className="w-8 h-8 stroke-[2.2]" />;
      case 'business':
        return <Briefcase className="w-8 h-8 stroke-[2.2]" />;
      case 'enterprise':
        return <Crown className="w-8 h-8 stroke-[2.2]" />;
      case 'custom':
        return <Sliders className="w-8 h-8 stroke-[2.2]" />;
      default:
        return <TrendingUp className="w-8 h-8 stroke-[2.2]" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Left Big Icon */}
        <div className="shrink-0">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${
              plan.iconBg || 'bg-blue-600'
            } text-white flex items-center justify-center shadow-lg shadow-blue-600/20`}
          >
            {renderIcon()}
          </div>
        </div>

        {/* 5-Column Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-6 flex-1 text-xs">
          {/* Col 1: Plan Name & Plan Code */}
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 font-medium block">Plan Name</span>
              <span className="text-sm sm:text-base font-bold text-slate-900 block mt-0.5">
                {plan.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Plan Code</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-slate-800 tracking-wide">
                  {plan.code || plan.name.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded cursor-pointer"
                  title="Copy Plan Code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Col 2: Price & Yearly Discount */}
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 font-medium block">Price</span>
              <span className="text-sm sm:text-base font-bold text-slate-900 block mt-0.5">
                {plan.price}{' '}
                <span className="text-slate-400 text-xs font-normal">
                  {plan.billingPeriod || '/ month'}
                </span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                <span className="font-medium text-slate-700">
                  {plan.yearlyPrice || '৳25,000'} / year
                </span>
                {plan.yearlyDiscount && (
                  <span className="text-emerald-600 font-bold">
                    ({plan.yearlyDiscount})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Col 3: Billing Cycle & Trial */}
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 font-medium block">Billing Cycle</span>
              <span className="text-sm sm:text-base font-bold text-slate-900 block mt-0.5">
                {plan.billingCycle || 'Monthly'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Trial Available</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span className="font-semibold text-emerald-600">
                  {plan.trialAvailable !== false ? `Yes (${plan.trialDays || 14} days)` : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Col 4: Status & Created At */}
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 font-medium block">Status</span>
              <span
                className={`text-sm sm:text-base font-bold block mt-0.5 ${
                  plan.status === 'Active' ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                {plan.status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Created At</span>
              <span className="font-medium text-slate-700 block mt-0.5">
                {plan.createdAt.date} {plan.createdAt.time}
              </span>
            </div>
          </div>

          {/* Col 5: Plan Visibility & Last Updated */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <div>
              <span className="text-slate-400 font-medium block">Plan Visibility</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-emerald-700">
                  {plan.visibility || 'Visible to merchants'}
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Last Updated</span>
              <span className="font-medium text-slate-700 block mt-0.5">
                {plan.updatedAt?.date || plan.createdAt.date}{' '}
                {plan.updatedAt?.time || plan.createdAt.time}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
