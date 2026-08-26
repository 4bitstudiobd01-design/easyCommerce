'use client';

import React from 'react';
import { Search, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { AdminUsersFilterState } from './types';

interface UsersFilterBarProps {
  filters: AdminUsersFilterState;
  onFilterChange: (key: keyof AdminUsersFilterState, value: string) => void;
  onResetFilters: () => void;
  onOpenAdvancedFilters?: () => void;
}

export function UsersFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  onOpenAdvancedFilters,
}: UsersFilterBarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.role !== 'all' ||
    filters.status !== 'all' ||
    filters.lastLogin !== 'all';

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
            placeholder="Search by name, email or username..."
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
          {/* 1. All Roles Dropdown */}
          <div className="relative">
            <select
              value={filters.role}
              onChange={(e) => onFilterChange('role', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Platform Manager">Platform Manager</option>
              <option value="Support Agent">Support Agent</option>
              <option value="Finance Admin">Finance Admin</option>
              <option value="Security Admin">Security Admin</option>
              <option value="Others">Others</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 2. All Status Dropdown */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 3. Last Login Dropdown */}
          <div className="relative">
            <select
              value={filters.lastLogin}
              onChange={(e) => onFilterChange('lastLogin', e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="all">Last Login</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filters Button */}
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>

          {/* Reset Filters Pill */}
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
