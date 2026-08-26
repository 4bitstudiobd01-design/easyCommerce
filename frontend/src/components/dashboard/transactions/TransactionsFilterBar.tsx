'use client';

import React from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react';
import { TransactionFilterState } from './types';

interface TransactionsFilterBarProps {
  filters: TransactionFilterState;
  onFilterChange: (key: keyof TransactionFilterState, value: string) => void;
  onOpenAdvancedFilters?: () => void;
}

export function TransactionsFilterBar({
  filters,
  onFilterChange,
  onOpenAdvancedFilters,
}: TransactionsFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Left: Search & Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search by transaction ID, merchant or store..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
          />
        </div>

        {/* 1. All Types Dropdown */}
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer outline-none transition-all shadow-2xs"
          >
            <option value="all">All Types</option>
            <option value="Subscription Payment">Subscription Payment</option>
            <option value="Plan Upgrade">Plan Upgrade</option>
            <option value="Payout">Payout</option>
            <option value="Refund">Refund</option>
            <option value="One-time Charge">One-time Charge</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 2. All Status Dropdown */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer outline-none transition-all shadow-2xs"
          >
            <option value="all">All Status</option>
            <option value="Success">Success</option>
            <option value="Refunded">Refunded</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 3. All Gateways Dropdown */}
        <div className="relative">
          <select
            value={filters.gateway}
            onChange={(e) => onFilterChange('gateway', e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer outline-none transition-all shadow-2xs"
          >
            <option value="all">All Gateways</option>
            <option value="stripe">Stripe</option>
            <option value="sslcommerz">SSLCommerz</option>
            <option value="bkash">bKash</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 4. All Merchants Dropdown */}
        <div className="relative hidden xl:block">
          <select
            value={filters.merchant}
            onChange={(e) => onFilterChange('merchant', e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer outline-none transition-all shadow-2xs"
          >
            <option value="all">All Merchants</option>
            <option value="Urban Style Store">Urban Style Store</option>
            <option value="ABC Fashion Store">ABC Fashion Store</option>
            <option value="Gadget Hub">Gadget Hub</option>
            <option value="Book Haven">Book Haven</option>
            <option value="Daily Essentials">Daily Essentials</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Right: More Filters & Layout Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenAdvancedFilters}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>More Filters</span>
        </button>

        <button
          type="button"
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-2xs transition-all cursor-pointer"
          title="Toggle view"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
