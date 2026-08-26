'use client';

import React from 'react';
import { Search, Filter, LayoutGrid, ChevronDown } from 'lucide-react';
import { MerchantFilterState } from './types';

interface MerchantsFilterBarProps {
  filters: MerchantFilterState;
  onFilterChange: (key: keyof MerchantFilterState, value: string) => void;
  onOpenAdvancedFilters?: () => void;
}

export function MerchantsFilterBar({
  filters,
  onFilterChange,
  onOpenAdvancedFilters,
}: MerchantsFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      {/* Left side: Search & Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search by name, email, phone or domain..."
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
            <option value="Trial">Trial</option>
            <option value="Suspended">Suspended</option>
            <option value="Churned">Churned</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Plans Select */}
        <div className="relative">
          <select
            value={filters.plan}
            onChange={(e) => onFilterChange('plan', e.target.value)}
            aria-label="Filter by Plan"
            className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
          >
            <option value="all">All Plans</option>
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Business">Business</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Countries Select */}
        <div className="relative">
          <select
            value={filters.country}
            onChange={(e) => onFilterChange('country', e.target.value)}
            aria-label="Filter by Country"
            className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
          >
            <option value="all">All Countries</option>
            <option value="Bangladesh">Bangladesh</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="UAE">UAE</option>
            <option value="India">India</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Registration Sources Select */}
        <div className="relative">
          <select
            value={filters.source}
            onChange={(e) => onFilterChange('source', e.target.value)}
            aria-label="Filter by Registration Source"
            className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
          >
            <option value="all">All Registration Sources</option>
            <option value="Organic Search">Organic Search</option>
            <option value="Facebook Ads">Facebook Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Referral">Referral</option>
            <option value="Direct">Direct</option>
            <option value="Partner">Partner</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Right side: Filters button & Grid toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenAdvancedFilters}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-2xs transition-all"
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filters</span>
        </button>

        <button
          type="button"
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-2xs transition-all"
          title="Toggle Grid View"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
