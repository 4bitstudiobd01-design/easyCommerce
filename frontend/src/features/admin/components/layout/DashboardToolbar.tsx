'use client';

import React from 'react';
import { Calendar, RefreshCw, Filter, SlidersHorizontal } from 'lucide-react';
import { useDashboardFilters, DateRangePreset } from '../../context/DashboardFilterContext';

export interface DashboardToolbarProps {
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function DashboardToolbar({ onRefreshAll, isRefreshing = false, className = '' }: DashboardToolbarProps) {
  const { filters, setDateRangePreset, resetFilters } = useDashboardFilters();

  const presets: { id: DateRangePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: '1y', label: '1 Year' },
  ];

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 py-3 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 ${className}`}>
      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setDateRangePreset(preset.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filters.dateRangePreset === preset.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex items-center gap-3 ml-auto">
        <button
          type="button"
          onClick={resetFilters}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>

        {onRefreshAll && (
          <button
            type="button"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh All'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
