'use client';

import React from 'react';
import { Search, Filter, LayoutGrid, Maximize2, ChevronDown } from 'lucide-react';
import { PlanFilterState } from './types';

interface PlansFilterBarProps {
  filters: PlanFilterState;
  onFilterChange: (key: keyof PlanFilterState, value: string) => void;
  onOpenAdvancedFilters?: () => void;
}

export function PlansFilterBar({
  filters,
  onFilterChange,
  onOpenAdvancedFilters,
}: PlansFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      {/* Left side: Search & Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search plans by name or description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* All Status Select */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            aria-label="Filter by Status"
            className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Billing Cycles Select */}
        <div className="relative">
          <select
            value={filters.billingCycle}
            onChange={(e) => onFilterChange('billingCycle', e.target.value)}
            aria-label="Filter by Billing Cycle"
            className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
          >
            <option value="all">All Billing Cycles</option>
            <option value="Monthly">Monthly</option>
            <option value="Annual">Annual</option>
            <option value="Custom">Custom</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Right side: Filters button, Grid toggle, Full view toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenAdvancedFilters}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filters</span>
        </button>

        <button
          type="button"
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-2xs transition-all cursor-pointer"
          title="Toggle Grid View"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-2xs transition-all cursor-pointer"
          title="Toggle Full View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
