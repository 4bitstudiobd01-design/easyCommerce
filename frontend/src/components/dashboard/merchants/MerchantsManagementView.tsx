'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  FileDown,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { MerchantsKpiCards } from './MerchantsKpiCards';
import { MerchantsFilterBar } from './MerchantsFilterBar';
import { MerchantsTable } from './MerchantsTable';
import { AddMerchantModal } from './AddMerchantModal';
import { MerchantDetailsDrawer } from './MerchantDetailsDrawer';
import { ExportModal } from './ExportModal';
import { INITIAL_MERCHANTS, MERCHANT_KPIS } from './merchantMockData';
import { MerchantFilterState, MerchantRecord } from './types';

export function MerchantsManagementView() {
  const [merchants, setMerchants] = useState<MerchantRecord[]>(INITIAL_MERCHANTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Aug 8 - Aug 14, 2026');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [filters, setFilters] = useState<MerchantFilterState>({
    search: '',
    status: 'all',
    plan: 'all',
    country: 'all',
    source: 'all',
    dateRange: 'Aug 8 - Aug 14, 2026',
  });

  const handleFilterChange = (key: keyof MerchantFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filtered merchants computation
  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      // 1. Search filter (name, email, phone, domain)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesDomain = m.domain.toLowerCase().includes(query);
        const matchesEmail = m.contact.email.toLowerCase().includes(query);
        const matchesPhone = m.contact.phone.toLowerCase().includes(query);
        if (!matchesName && !matchesDomain && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // 2. Status filter
      if (filters.status !== 'all' && m.status !== filters.status) {
        return false;
      }

      // 3. Plan filter
      if (filters.plan !== 'all' && m.plan !== filters.plan) {
        return false;
      }

      // 4. Country filter
      if (filters.country !== 'all' && m.country !== filters.country) {
        return false;
      }

      // 5. Source filter
      if (filters.source !== 'all' && m.registrationSource !== filters.source) {
        return false;
      }

      return true;
    });
  }, [merchants, filters]);

  const handleAddMerchant = (newMerchant: Partial<MerchantRecord>) => {
    setMerchants((prev) => [newMerchant as MerchantRecord, ...prev]);
  };

  const handleViewDetails = (merchant: MerchantRecord) => {
    setSelectedMerchant(merchant);
    setIsDetailsOpen(true);
  };

  const handleDeleteMerchant = (merchant: MerchantRecord) => {
    setMerchants((prev) => prev.filter((m) => m.id !== merchant.id));
    toast.success(`Merchant "${merchant.name}" deleted`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Merchants
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            Manage all merchants on the EasyCommerce platform.
          </p>
        </div>

        {/* Right: Actions (Date picker, Export, Add Merchant) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all"
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
                        toast.info(`Date range updated to ${preset}`);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors ${
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Add Merchant Primary Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Merchant</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Metric Cards (6 cards row) */}
      <MerchantsKpiCards kpis={MERCHANT_KPIS} />

      {/* 3. Search and Filters Toolbar */}
      <MerchantsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenAdvancedFilters={() => toast.info('Advanced filter drawer')}
      />

      {/* 4. Merchants Data Table */}
      <MerchantsTable
        merchants={filteredMerchants}
        onViewDetails={handleViewDetails}
        onEditMerchant={(m) => {
          setSelectedMerchant(m);
          setIsDetailsOpen(true);
        }}
        onDeleteMerchant={handleDeleteMerchant}
      />

      {/* 5. Modals & Side Drawer */}
      <AddMerchantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMerchant={handleAddMerchant}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalMerchantsCount={2548}
      />

      <MerchantDetailsDrawer
        merchant={selectedMerchant}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
