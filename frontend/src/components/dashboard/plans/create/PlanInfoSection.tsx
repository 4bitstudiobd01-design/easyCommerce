'use client';

import React from 'react';
import { CreatePlanFormData } from '../types';

interface PlanInfoSectionProps {
  formData: CreatePlanFormData;
  onChange: (field: keyof CreatePlanFormData, value: any) => void;
}

export function PlanInfoSection({ formData, onChange }: PlanInfoSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
        1. Plan Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Plan Name */}
        <div>
          <label className="text-slate-700 font-semibold block mb-1.5">
            Plan Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              onChange('name', name);
              // Auto generate code if code is empty or untouched
              if (!formData.code || formData.code === formData.name.toUpperCase().replace(/\s+/g, '_')) {
                onChange('code', name.toUpperCase().replace(/\s+/g, '_'));
              }
            }}
            placeholder="e.g. Business Plan"
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            required
          />
        </div>

        {/* Plan Code */}
        <div>
          <label className="text-slate-700 font-semibold block mb-1.5">
            Plan Code <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => onChange('code', e.target.value.toUpperCase().replace(/\s+/g, ''))}
            placeholder="e.g. BUSINESS"
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold uppercase tracking-wide text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            required
          />
          <span className="text-[11px] text-slate-400 font-normal mt-1 block">
            Unique code for this plan (no spaces)
          </span>
        </div>

        {/* Description (Left Column) */}
        <div>
          <label className="text-slate-700 font-semibold block mb-1.5">
            Description
          </label>
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Enter plan description..."
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all leading-relaxed"
          />
          <span className="text-[11px] text-slate-400 font-normal mt-1 block">
            Briefly describe this plan and who it is for.
          </span>
        </div>

        {/* Badge and Display Order (Right Column) */}
        <div className="space-y-4">
          {/* Plan Badge (Optional) */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5">
              Plan Badge (Optional)
            </label>
            <select
              value={formData.badge}
              onChange={(e) => onChange('badge', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Select badge</option>
              <option value="Popular">Popular</option>
              <option value="Recommended">Recommended</option>
              <option value="Best Value">Best Value</option>
              <option value="Enterprise">Enterprise</option>
              <option value="New">New</option>
              <option value="Featured">Featured</option>
            </select>
            <span className="text-[11px] text-slate-400 font-normal mt-1 block">
              Choose a badge to highlight this plan
            </span>
          </div>

          {/* Display Order */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5">
              Display Order
            </label>
            <input
              type="number"
              min={0}
              value={formData.displayOrder}
              onChange={(e) => onChange('displayOrder', Number(e.target.value))}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <span className="text-[11px] text-slate-400 font-normal mt-1 block">
              Lower numbers appear first
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
