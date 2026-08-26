'use client';

import React from 'react';
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  LayoutGrid,
  X,
} from 'lucide-react';
import { SupportFilterState } from './types';

interface SupportFilterBarProps {
  filters: SupportFilterState;
  onFilterChange: (key: keyof SupportFilterState, value: string) => void;
  onResetFilters: () => void;
  onOpenAdvancedFilters?: () => void;
  onToggleColumns?: () => void;
}

export function SupportFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  onOpenAdvancedFilters,
  onToggleColumns,
}: SupportFilterBarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.channel !== 'all';

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search by ticket ID, subject, merchant or store..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 font-medium rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all"
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

        {/* Dropdown Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. All Status Dropdown */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Merchant">Pending Merchant</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 2. All Priority Dropdown */}
          <div className="relative">
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Urgent">Urgent</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 3. All Categories Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">All Categories</option>
              <option value="Billing & Payments">Billing & Payments</option>
              <option value="Account & Access">Account & Access</option>
              <option value="Technical Issues">Technical Issues</option>
              <option value="Store Management">Store Management</option>
              <option value="Feature Requests">Feature Requests</option>
              <option value="Domain & SSL">Domain & SSL</option>
              <option value="Product Management">Product Management</option>
              <option value="Refund & Payout">Refund & Payout</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 4. All Channels Dropdown */}
          <div className="relative">
            <select
              value={filters.channel}
              onChange={(e) => onFilterChange('channel', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="Web">Web</option>
              <option value="Email">Email</option>
              <option value="Chat">Chat</option>
              <option value="Phone">Phone</option>
              <option value="API">API</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* More Filters Button */}
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">More Filters</span>
          </button>

          {/* View Toggle / Column Settings */}
          <button
            type="button"
            onClick={onToggleColumns}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 shadow-2xs transition-all cursor-pointer"
            title="Column View Settings"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          {/* Reset Filters Pill (when active) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
