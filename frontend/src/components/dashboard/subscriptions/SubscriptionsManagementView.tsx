'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  FileDown,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionKpiCards } from './SubscriptionKpiCards';
import { SubscriptionChartsGrid } from './SubscriptionChartsGrid';
import { ConversionFunnelCard } from './ConversionFunnelCard';
import { FailedPaymentsCard } from './FailedPaymentsCard';
import { SubscriptionsFilterBar } from './SubscriptionsFilterBar';
import { SubscriptionsTable } from './SubscriptionsTable';
import { AddSubscriptionModal } from './AddSubscriptionModal';
import { SubscriptionDetailsDrawer } from './SubscriptionDetailsDrawer';
import { ExportSubscriptionsModal } from './ExportSubscriptionsModal';
import { INITIAL_SUBSCRIPTIONS, SUBSCRIPTION_KPIS } from './subscriptionMockData';
import { SubscriptionFilterState, SubscriptionRecord } from './types';

export function SubscriptionsManagementView() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(INITIAL_SUBSCRIPTIONS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Aug 8 - Aug 14, 2026');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [filters, setFilters] = useState<SubscriptionFilterState>({
    search: '',
    plan: 'all',
    status: 'all',
    merchant: 'all',
    cycle: 'all',
    dateRange: 'Aug 8 - Aug 14, 2026',
  });

  const handleFilterChange = (key: keyof SubscriptionFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      // 1. Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesStore = s.storeName.toLowerCase().includes(q);
        const matchesMerchant = s.merchantName.toLowerCase().includes(q);
        const matchesDomain = s.domain.toLowerCase().includes(q);
        const matchesCode = s.codeId.toLowerCase().includes(q);
        if (!matchesStore && !matchesMerchant && !matchesDomain && !matchesCode) {
          return false;
        }
      }

      // 2. Plan filter
      if (filters.plan !== 'all' && s.plan !== filters.plan) {
        return false;
      }

      // 3. Status filter
      if (filters.status !== 'all' && s.status !== filters.status) {
        return false;
      }

      // 4. Merchant filter
      if (filters.merchant !== 'all' && s.merchantName !== filters.merchant) {
        return false;
      }

      // 5. Billing Cycle filter
      if (filters.cycle !== 'all' && s.billingCycle !== filters.cycle) {
        return false;
      }

      return true;
    });
  }, [subscriptions, filters]);

  const handleAddSub = (newSub: Partial<SubscriptionRecord>) => {
    setSubscriptions((prev) => [newSub as SubscriptionRecord, ...prev]);
  };

  const handleViewDetails = (sub: SubscriptionRecord) => {
    setSelectedSub(sub);
    setIsDetailsOpen(true);
  };

  const handleCancelSub = (sub: SubscriptionRecord) => {
    setSubscriptions((prev) =>
      prev.map((item) =>
        item.id === sub.id ? { ...item, status: 'Cancelled' as const } : item
      )
    );
    toast.success(`Subscription ${sub.codeId} cancelled`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Subscriptions
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            Monitor and manage all merchant subscriptions.
          </p>
        </div>

        {/* Right: Actions (Date picker, Export, Add Subscription) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDatePickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDatePickerOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                  {[
                    'Aug 8 - Aug 14, 2026',
                    'Last 7 Days',
                    'Last 30 Days',
                    'This Month',
                    'Last Quarter',
                    'All Time',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDateRange(preset);
                        setIsDatePickerOpen(false);
                        toast.info(`Date range set to ${preset}`);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer ${
                        dateRange === preset
                          ? 'font-bold text-emerald-700 bg-emerald-50/60'
                          : 'text-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Add Subscription Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Metric Cards (6 cards row) */}
      <SubscriptionKpiCards kpis={SUBSCRIPTION_KPIS} />

      {/* 3. Analytical Charts Grid (4 charts) */}
      <SubscriptionChartsGrid />

      {/* 4. Main Section Split Layout (Table + Right Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
        {/* Left / Main Table Area (3 Columns on xl) */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4">
          <SubscriptionsFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onOpenAdvancedFilters={() => toast.info('Advanced filters')}
          />

          <SubscriptionsTable
            subscriptions={filteredSubscriptions}
            onViewDetails={handleViewDetails}
            onEditSub={(s) => {
              setSelectedSub(s);
              setIsDetailsOpen(true);
            }}
            onCancelSub={handleCancelSub}
          />
        </div>

        {/* Right Side Widgets (1 Column on xl) */}
        <div className="space-y-4">
          <ConversionFunnelCard />
          <FailedPaymentsCard />
        </div>
      </div>

      {/* 5. Modals & Drawers */}
      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSub={handleAddSub}
      />

      <ExportSubscriptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalSubscriptionsCount={2584}
      />

      <SubscriptionDetailsDrawer
        subscription={selectedSub}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
