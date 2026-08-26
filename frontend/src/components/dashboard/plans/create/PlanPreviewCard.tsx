'use client';

import React from 'react';
import { Crown, Check } from 'lucide-react';
import { CreatePlanFormData } from '../types';

interface PlanPreviewCardProps {
  formData: CreatePlanFormData;
}

export function PlanPreviewCard({ formData }: PlanPreviewCardProps) {
  const highlights =
    formData.featureHighlights?.length > 0
      ? formData.featureHighlights
      : [
          'Feature highlight goes here',
          'Another key feature',
          'And more great features',
          'Perfect for growing businesses',
        ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight">
        Plan Preview
      </h3>

      {/* Inner Preview Box */}
      <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 text-center space-y-4">
        {/* Crown Icon Badge */}
        <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
          <Crown className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Title & Badge */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {formData.name || 'Plan Name'}
          </span>
          {formData.badge ? (
            <span className="bg-emerald-100/80 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {formData.badge}
            </span>
          ) : (
            <span className="bg-emerald-100/70 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Badge
            </span>
          )}
        </div>

        {/* Price */}
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ৳{formData.price || '0'}{' '}
            <span className="text-xs font-normal text-slate-400">/ month</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Billed {formData.billingCycle.toLowerCase()}
          </span>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2 text-left pt-2 border-t border-slate-200/60">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-slate-700 font-medium"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
