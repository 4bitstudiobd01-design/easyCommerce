'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  FileDown,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { StoresKpiCards } from './StoresKpiCards';
import { StoresFilterBar } from './StoresFilterBar';
import { StoresTable } from './StoresTable';
import { AddStoreModal } from './AddStoreModal';
import { StoreDetailsDrawer } from './StoreDetailsDrawer';
import { ExportStoresModal } from './ExportStoresModal';
import { INITIAL_STORES, STORE_KPIS } from './storesMockData';
import { StoreFilterState, StoreRecord } from './types';

export function StoresManagementView() {
  const [stores, setStores] = useState<StoreRecord[]>(INITIAL_STORES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Aug 8 - Aug 14, 2026');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [filters, setFilters] = useState<StoreFilterState>({
    search: '',
    merchant: 'all',
    status: 'all',
    plan: 'all',
    country: 'all',
    dateRange: 'Aug 8 - Aug 14, 2026',
  });

  const handleFilterChange = (key: keyof StoreFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filtered stores computation
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      // 1. Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDomain = s.domain.toLowerCase().includes(q);
        const matchesMerchant = s.merchant.name.toLowerCase().includes(q);
        const matchesEmail = s.merchant.email.toLowerCase().includes(q);
        const matchesId = s.codeId.toLowerCase().includes(q);
        if (!matchesName && !matchesDomain && !matchesMerchant && !matchesEmail && !matchesId) {
          return false;
        }
      }

      // 2. Merchant filter
      if (filters.merchant !== 'all' && s.merchant.name !== filters.merchant) {
        return false;
      }

      // 3. Status filter
      if (filters.status !== 'all' && s.status !== filters.status) {
        return false;
      }

      // 4. Plan filter
      if (filters.plan !== 'all' && s.plan !== filters.plan) {
        return false;
      }

      // 5. Country filter
      if (filters.country !== 'all' && s.country.code !== filters.country) {
        return false;
      }

      return true;
    });
  }, [stores, filters]);

  const handleAddStore = (newStore: Partial<StoreRecord>) => {
    setStores((prev) => [newStore as StoreRecord, ...prev]);
  };

  const handleViewDetails = (store: StoreRecord) => {
    setSelectedStore(store);
    setIsDetailsOpen(true);
  };

  const handleDeleteStore = (store: StoreRecord) => {
    setStores((prev) => prev.filter((s) => s.id !== store.id));
    toast.success(`Store "${store.name}" deleted`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Stores
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            Manage all stores on the EasyCommerce platform.
          </p>
        </div>

        {/* Right: Actions (Date picker, Export, Add Store) */}
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

          {/* Add Store Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Metric Cards (5 cards grid) */}
      <StoresKpiCards kpis={STORE_KPIS} />

      {/* 3. Search and Filters Toolbar */}
      <StoresFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenAdvancedFilters={() => toast.info('Advanced filter drawer')}
      />

      {/* 4. Stores Data Table */}
      <StoresTable
        stores={filteredStores}
        onViewDetails={handleViewDetails}
        onEditStore={(s) => {
          setSelectedStore(s);
          setIsDetailsOpen(true);
        }}
        onDeleteStore={handleDeleteStore}
      />

      {/* 5. Modals & Side Drawer */}
      <AddStoreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStore={handleAddStore}
      />

      <ExportStoresModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalStoresCount={2731}
      />

      <StoreDetailsDrawer
        store={selectedStore}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
