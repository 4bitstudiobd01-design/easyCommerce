'use client';

import React from 'react';
import { Search, Filter, Calendar, X, Globe } from 'lucide-react';
import { CustomerStatusType } from '../api/customerApi';

interface CustomerFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: CustomerStatusType | 'ALL';
  onStatusChange: (status: CustomerStatusType | 'ALL') => void;
  originFilter: string;
  onOriginChange: (origin: string) => void;
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
  originFilter,
  onOriginChange,
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
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Origin Select */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">Origin:</span>
          <select
            value={originFilter}
            onChange={(e) => onOriginChange(e.target.value)}
            aria-label="Filter customers by marketing origin"
            className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
          >
            <option value="ALL">All Origins</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="google">Google</option>
            <option value="youtube">YouTube</option>
            <option value="direct">Direct</option>
            <option value="organic_search">Organic Search</option>
            <option value="social">Social</option>
            <option value="referral">Referral</option>
            <option value="email">Email</option>
            <option value="other">Other</option>
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

