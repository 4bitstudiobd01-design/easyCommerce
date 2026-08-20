'use client';

import React, { useState } from 'react';
import {
  Store,
  Package,
  Layers,
  ShoppingBag,
  Users,
  HardDrive,
  Activity,
  Globe,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { CreatePlanFormData } from '../types';

interface PlanLimitsSectionProps {
  formData: CreatePlanFormData;
  onChange: (field: keyof CreatePlanFormData, value: any) => void;
  onAdvancedChange?: (field: keyof NonNullable<CreatePlanFormData['advancedLimits']>, value: any) => void;
}

export function PlanLimitsSection({
  formData,
  onChange,
  onAdvancedChange,
}: PlanLimitsSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const advanced = formData.advancedLimits || {
    apiAccess: true,
    posAccess: true,
    abandonedCart: true,
    multiWarehouse: false,
    webhooks: true,
    smsSends: '1,000 / month',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
        3. Plan Limits
      </h2>

      {/* Grid: 4 columns on lg, 2 on sm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
        {/* 1. Stores */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Stores</span>
          </div>
          <input
            type="number"
            min={1}
            value={formData.stores}
            onChange={(e) => onChange('stores', Number(e.target.value))}
            placeholder="1"
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <span className="text-[11px] text-slate-400 font-normal block">
            Number of stores allowed
          </span>
        </div>

        {/* 2. Products */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span>Products</span>
          </div>
          <input
            type="text"
            value={formData.products}
            onChange={(e) => onChange('products', e.target.value)}
            placeholder="1000"
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <span className="text-[11px] text-slate-400 font-normal block">
            Total products allowed
          </span>
        </div>

        {/* 3. Product Variants */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Product Variants</span>
          </div>
          <input
            type="text"
            value={formData.productVariants}
            onChange={(e) => onChange('productVariants', e.target.value)}
            placeholder="Unlimited"
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <span className="text-[11px] text-slate-400 font-normal block">
            Variants per product
          </span>
        </div>

        {/* 4. Orders / Month */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Orders / Month</span>
          </div>
          <input
            type="text"
            value={formData.monthlyOrders}
            onChange={(e) => onChange('monthlyOrders', e.target.value)}
            placeholder="500"
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <span className="text-[11px] text-slate-400 font-normal block">
            Maximum orders per month
          </span>
        </div>

        {/* 5. Staff Accounts */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Staff Accounts</span>
          </div>
          <input
            type="number"
            min={1}
            value={formData.staffAccounts}
            onChange={(e) => onChange('staffAccounts', Number(e.target.value))}
            placeholder="5"
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <span className="text-[11px] text-slate-400 font-normal block">
            Team members allowed
          </span>
        </div>

        {/* 6. Storage */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>Storage</span>
          </div>
          <div className="flex items-center">
            <input
              type="number"
              min={1}
              value={formData.storage}
              onChange={(e) => onChange('storage', Number(e.target.value))}
              placeholder="10"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-r-0 border-slate-200 rounded-l-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <select
              value={formData.storageUnit}
              onChange={(e) => onChange('storageUnit', e.target.value as any)}
              className="px-2.5 py-2.5 bg-slate-100 border border-slate-200 rounded-r-xl font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="GB">GB</option>
              <option value="TB">TB</option>
              <option value="MB">MB</option>
            </select>
          </div>
          <span className="text-[11px] text-slate-400 font-normal block">
            Total storage space
          </span>
        </div>

        {/* 7. Bandwidth / Month */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>Bandwidth / Month</span>
          </div>
          <div className="flex items-center">
            <input
              type="number"
              min={1}
              value={formData.bandwidth}
              onChange={(e) => onChange('bandwidth', Number(e.target.value))}
              placeholder="100"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-r-0 border-slate-200 rounded-l-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <select
              value={formData.bandwidthUnit}
              onChange={(e) => onChange('bandwidthUnit', e.target.value as any)}
              className="px-2.5 py-2.5 bg-slate-100 border border-slate-200 rounded-r-xl font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="GB">GB</option>
              <option value="TB">TB</option>
            </select>
          </div>
          <span className="text-[11px] text-slate-400 font-normal block">
            Monthly bandwidth limit
          </span>
        </div>

        {/* 8. Custom Domain Toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>Custom Domain</span>
          </div>
          <div className="pt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange('customDomain', !formData.customDomain)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                formData.customDomain ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  formData.customDomain ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-slate-800">
              {formData.customDomain ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal block">
            Allow custom domain
          </span>
        </div>
      </div>

      {/* Advanced Limits Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer transition-colors mx-auto"
        >
          <span>{showAdvanced ? 'Hide Advanced Limits' : 'Show Advanced Limits'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-100/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            {/* API Access */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">REST & GraphQL API</span>
                <span className="text-[11px] text-slate-400">Developer API access</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAdvancedChange?.('apiAccess', !advanced.apiAccess)
                }
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  advanced.apiAccess ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                    advanced.apiAccess ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* POS Access */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">POS Integration</span>
                <span className="text-[11px] text-slate-400">Retail counter cashier app</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAdvancedChange?.('posAccess', !advanced.posAccess)
                }
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  advanced.posAccess ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                    advanced.posAccess ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Abandoned Cart Recovery */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Abandoned Cart Recovery</span>
                <span className="text-[11px] text-slate-400">Automated SMS/email recovery</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAdvancedChange?.('abandonedCart', !advanced.abandonedCart)
                }
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  advanced.abandonedCart ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                    advanced.abandonedCart ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
