'use client';

import React from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { CustomerStatusType, CustomerSourceType } from '../api/customerApi';

interface CustomerFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: CustomerStatusType | 'ALL';
  onStatusChange: (status: CustomerStatusType | 'ALL') => void;
  sourceFilter: CustomerSourceType | 'ALL';
  onSourceChange: (source: CustomerSourceType | 'ALL') => void;
  dateRangeFilter: string;
  onDateRangeChange: (range: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function CustomerFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sourceFilter,
  onSourceChange,
  dateRangeFilter,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
}: CustomerFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, or phone..."
          aria-label="Search customers by name, email, or phone"
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Filter Select */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">Date:</span>
          <select
            value={dateRangeFilter}
            onChange={(e) => onDateRangeChange(e.target.value)}
            aria-label="Filter customers by registration date"
            className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
          >
            <option value="ALL">All Time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">This year</option>
          </select>
        </div>

        {/* Status Select */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as any)}
            aria-label="Filter customers by status"
            className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Source Select */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <span className="text-slate-400 text-[11px]">Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => onSourceChange(e.target.value as any)}
            aria-label="Filter customers by acquisition source"
            className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
          >
            <option value="ALL">All Sources</option>
            <option value="ONLINE_STORE">Online Store</option>
            <option value="MANUAL">Manual</option>
            <option value="POS">POS</option>
            <option value="IMPORT">Import</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            aria-label="Clear active filters"
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
