'use client';

import React from 'react';
import { Search, ChevronDown, SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { PermissionsFilterState } from './types';

interface PermissionsFilterBarProps {
  filters: PermissionsFilterState;
  onFilterChange: (key: keyof PermissionsFilterState, value: string) => void;
  onResetFilters: () => void;
  onOpenAdvancedFilters?: () => void;
}

export function PermissionsFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  onOpenAdvancedFilters,
}: PermissionsFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search permissions by name or key..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 font-medium rounded-xl border border-slate-200/80 focus:border-[#008060] focus:outline-hidden focus:ring-2 focus:ring-[#008060]/20 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <div className="relative">
            <select
              value={filters.module}
              onChange={(e) => onFilterChange('module', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-[#008060] focus:outline-hidden focus:ring-2 focus:ring-[#008060]/20 transition-all cursor-pointer"
            >
              <option value="all">All Modules</option>
              <option value="Dashboard">Dashboard</option>
              <option value="Merchants">Merchants</option>
              <option value="Stores">Stores</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Plans">Plans</option>
              <option value="Transactions">Transactions</option>
              <option value="Support">Support</option>
              <option value="Reports">Reports</option>
              <option value="Settings">Settings</option>
              <option value="Audit Logs">Audit Logs</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <select
              value={filters.action}
              onChange={(e) => onFilterChange('action', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-[#008060] focus:outline-hidden focus:ring-2 focus:ring-[#008060]/20 transition-all cursor-pointer"
            >
              <option value="all">All Actions</option>
              <option value="View">View</option>
              <option value="Create / Edit">Create / Edit</option>
              <option value="Delete">Delete</option>
              <option value="Update">Update</option>
              <option value="Refund">Refund</option>
              <option value="Export">Export</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-[#008060] focus:outline-hidden focus:ring-2 focus:ring-[#008060]/20 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filters Advanced Button */}
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>

          {/* Reset Refresh Button */}
          <button
            type="button"
            onClick={onResetFilters}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 shadow-2xs transition-all cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
