'use client';

import React from 'react';
import { Plus, Sliders, Columns, Settings } from 'lucide-react';

interface QuickActionsCardProps {
  onAddPlan: () => void;
  onOpenFeatures: () => void;
  onOpenComparison: () => void;
  onOpenPricing: () => void;
}

export function QuickActionsCard({
  onAddPlan,
  onOpenFeatures,
  onOpenComparison,
  onOpenPricing,
}: QuickActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
      <h3 className="text-sm font-bold text-slate-900 mb-3">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onAddPlan}
          className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-all cursor-pointer text-left"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Add New Plan</span>
        </button>

        <button
          type="button"
          onClick={onOpenFeatures}
          className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-700 transition-all cursor-pointer text-left"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Plan Features</span>
        </button>

        <button
          type="button"
          onClick={onOpenComparison}
          className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-purple-700 transition-all cursor-pointer text-left"
        >
          <Columns className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span className="truncate">Plan Comparison</span>
        </button>

        <button
          type="button"
          onClick={onOpenPricing}
          className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-amber-700 transition-all cursor-pointer text-left"
        >
          <Settings className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">Pricing Settings</span>
        </button>
      </div>
    </div>
  );
}
