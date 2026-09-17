'use client';

import React from 'react';
import { DollarSign, Percent, TrendingUp, AlertTriangle } from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { ProductDiscountType, TaxCategory } from '@/features/catalog/api/catalogApi';

interface PricingTabProps {
  form: ProductFormState;
}

export function PricingTab({ form }: PricingTabProps) {
  const {
    storeCurrency,
    currencySymbol,
    basePrice, setBasePrice,
    compareAtPrice, setCompareAtPrice,
    costPrice, setCostPrice,
    numericBasePrice,
    numericCompareAt,
    numericCostPrice,
    profitAmount,
    marginPercent,
    taxCategory, setTaxCategory,
    taxRate, setTaxRate,
    isTaxInclusive, setIsTaxInclusive,
    discountType, setDiscountType,
    discountValue, setDiscountValue,
    discountStartsAt, setDiscountStartsAt,
    discountEndsAt, setDiscountEndsAt,
  } = form;

  const compareAtBelowSelling =
    numericCompareAt > 0 && numericBasePrice > 0 && numericCompareAt <= numericBasePrice;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span>Pricing, Tax & Discount Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Set price points, tax classification, and scheduled product discounts</p>
        </div>

        <span className="px-2.5 py-1 bg-slate-100 border text-slate-700 rounded-lg text-xs font-mono font-bold">
          {storeCurrency} ({currencySymbol})
        </span>
      </div>

      {/* 3 Price Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Selling Price ({currencySymbol}) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value !== '' ? Number(e.target.value) : '')}
            placeholder="0.00"
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">Customer base selling price</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Compare-at ({currencySymbol})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value !== '' ? Number(e.target.value) : '')}
            placeholder="0.00"
            className={`w-full px-3.5 py-2 bg-white border rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
              compareAtBelowSelling
                ? 'border-amber-400 focus:ring-amber-500/20 focus:border-amber-500'
                : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
          {compareAtBelowSelling ? (
            <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3 h-3" />
              Must be higher than the selling price to show as a discount.
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1">Original strike-through price</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Cost Price ({currencySymbol})</span>
            <span className="text-[10px] text-slate-400 font-normal">Internal</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value !== '' ? Number(e.target.value) : '')}
            placeholder="0.00"
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">Merchant cost per unit</p>
        </div>
      </div>

      {/* Profit & Margin Live Preview */}
      {numericCostPrice > 0 && numericBasePrice > 0 && (
        <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Estimated Merchant Profit:</span>
            <span className="font-extrabold">{currencySymbol}{profitAmount.toLocaleString()}</span>
          </div>
          <div className="font-bold bg-blue-100 px-2.5 py-1 rounded-lg text-blue-800 text-[11px]">
            {marginPercent}% Margin
          </div>
        </div>
      )}

      {/* Tax Settings */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tax Classification
          </label>
          <select
            value={taxCategory}
            onChange={(e) => setTaxCategory(e.target.value as TaxCategory)}
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="STANDARD_VAT">Standard VAT (15%)</option>
            <option value="REDUCED">Reduced Rate (5%)</option>
            <option value="ZERO_RATED">Zero Rated (0%)</option>
            <option value="EXEMPT">Tax Exempt</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tax Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isTaxInclusive}
              onChange={(e) => setIsTaxInclusive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">
              Selling Price already includes tax (Tax Inclusive)
            </span>
          </label>
        </div>
      </div>

      {/* Discount Configuration */}
      <div className="pt-3 border-t border-slate-100 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-blue-600" />
          <span>Product Sale / Discount Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Discount Type
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as ProductDiscountType)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="NONE">No Discount</option>
              <option value="PERCENTAGE">Percentage (%) Off</option>
              <option value="FIXED">Fixed Amount ({currencySymbol}) Off</option>
            </select>
          </div>

          {discountType !== 'NONE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Discount Value {discountType === 'PERCENTAGE' ? '(%)' : `(${currencySymbol})`}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder={discountType === 'PERCENTAGE' ? '10' : '200'}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {discountType !== 'NONE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Schedule Start Datetime (Optional)
              </label>
              <input
                type="datetime-local"
                value={discountStartsAt}
                onChange={(e) => setDiscountStartsAt(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Schedule End Datetime (Optional)
              </label>
              <input
                type="datetime-local"
                value={discountEndsAt}
                onChange={(e) => setDiscountEndsAt(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
