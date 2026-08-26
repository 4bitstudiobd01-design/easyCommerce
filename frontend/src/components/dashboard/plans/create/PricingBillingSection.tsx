'use client';

import React from 'react';
import { CreatePlanFormData } from '../types';

interface PricingBillingSectionProps {
  formData: CreatePlanFormData;
  onChange: (field: keyof CreatePlanFormData, value: any) => void;
}

export function PricingBillingSection({
  formData,
  onChange,
}: PricingBillingSectionProps) {
  // Auto calculate yearly price when monthly price or discount % changes
  const handlePriceChange = (val: string) => {
    onChange('price', val);
    const num = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    if (formData.offerYearlyDiscount && num > 0) {
      const discount = formData.yearlyDiscountPercent || 17;
      const yearly = Math.round(num * 12 * (1 - discount / 100));
      onChange('yearlyPrice', yearly.toString());
    }
  };

  const handleDiscountToggle = (checked: boolean) => {
    onChange('offerYearlyDiscount', checked);
    if (checked) {
      const num = parseFloat(formData.price.replace(/[^0-9.]/g, '')) || 0;
      const discount = formData.yearlyDiscountPercent || 17;
      if (num > 0) {
        const yearly = Math.round(num * 12 * (1 - discount / 100));
        onChange('yearlyPrice', yearly.toString());
      }
    }
  };

  const handleDiscountPercentChange = (val: number) => {
    onChange('yearlyDiscountPercent', val);
    const num = parseFloat(formData.price.replace(/[^0-9.]/g, '')) || 0;
    if (num > 0 && formData.offerYearlyDiscount) {
      const yearly = Math.round(num * 12 * (1 - val / 100));
      onChange('yearlyPrice', yearly.toString());
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
        2. Pricing & Billing
      </h2>

      <div className="space-y-4 text-xs">
        {/* Row 1: Price, Billing Cycle, Yearly Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Price */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5">
              Price <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500 font-bold text-sm select-none">
                ৳
              </span>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>
            <span className="text-[11px] text-slate-400 font-normal mt-1 block">
              Monthly price for this plan
            </span>
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5">
              Billing Cycle <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.billingCycle}
              onChange={(e) => onChange('billingCycle', e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="Monthly">Monthly</option>
              <option value="Annual">Yearly / Annual</option>
              <option value="Quarterly">Quarterly</option>
              <option value="One-time">One-time</option>
              <option value="Custom">Custom</option>
            </select>
            <span className="text-[11px] text-slate-400 font-normal mt-1 block">
              How often merchants will be billed
            </span>
          </div>

          {/* Yearly Price (Optional) */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5">
              Yearly Price (Optional)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500 font-bold text-sm select-none">
                ৳
              </span>
              <input
                type="text"
                value={formData.yearlyPrice}
                onChange={(e) => onChange('yearlyPrice', e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <span className="text-[11px] text-slate-400 font-normal mt-1 block">
              If set, merchants can choose yearly billing
            </span>
          </div>
        </div>

        {/* Row 2: Offer Yearly Discount Card */}
        <div className="bg-[#F0FDF4] border border-emerald-100/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleDiscountToggle(!formData.offerYearlyDiscount)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                formData.offerYearlyDiscount ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  formData.offerYearlyDiscount ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <span className="font-bold text-slate-900 block">Offer yearly discount</span>
              <span className="text-slate-500 text-[11px]">
                Enable to offer discount on yearly billing
              </span>
            </div>
          </div>

          {/* Right Discount Input */}
          {formData.offerYearlyDiscount && (
            <div className="sm:w-64">
              <label className="text-slate-700 font-semibold block mb-1">
                Yearly Discount (%)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.yearlyDiscountPercent}
                  onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                  placeholder="17"
                  className="w-full pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <span className="absolute right-3 text-slate-400 font-bold">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Discount percentage on yearly billing
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
