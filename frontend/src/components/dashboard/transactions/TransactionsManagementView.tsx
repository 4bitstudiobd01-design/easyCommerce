'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { TransactionsKpiCards } from './TransactionsKpiCards';
import { TransactionsFilterBar } from './TransactionsFilterBar';
import { TransactionsTable } from './TransactionsTable';
import { TransactionOverviewDonutCard } from './TransactionOverviewDonutCard';
import { RevenueByGatewayCard } from './RevenueByGatewayCard';
import { TopMerchantsRevenueCard } from './TopMerchantsRevenueCard';
import { TransactionQuickActionsCard } from './TransactionQuickActionsCard';
import { TransactionDetailsView } from './details/TransactionDetailsView';
import { ExportTransactionsModal } from './ExportTransactionsModal';
import { PayoutsModal } from './PayoutsModal';
import { RefundRequestsModal } from './RefundRequestsModal';
import {
  INITIAL_TRANSACTIONS,
  TRANSACTIONS_KPIS,
} from './transactionsMockData';
import { TransactionFilterState, TransactionRecord } from './types';

export function TransactionsManagementView() {
  const [transactions, setTransactions] =
    useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [activeDetailsTxn, setActiveDetailsTxn] =
    useState<TransactionRecord | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPayoutsOpen, setIsPayoutsOpen] = useState(false);
  const [isRefundsOpen, setIsRefundsOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Aug 8 - Aug 14, 2026');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [filters, setFilters] = useState<TransactionFilterState>({
    search: '',
    type: 'all',
    status: 'all',
    gateway: 'all',
    merchant: 'all',
    dateRange: 'Aug 8 - Aug 14, 2026',
  });

  const handleFilterChange = (
    key: keyof TransactionFilterState,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesRef = t.reference.toLowerCase().includes(q);
        const matchesMerchant = t.merchant.name.toLowerCase().includes(q);
        const matchesDomain = t.merchant.domain.toLowerCase().includes(q);
        if (!matchesId && !matchesRef && !matchesMerchant && !matchesDomain) {
          return false;
        }
      }

      // 2. Type
      if (filters.type !== 'all' && t.type !== filters.type) {
        return false;
      }

      // 3. Status
      if (filters.status !== 'all' && t.status !== filters.status) {
        return false;
      }

      // 4. Gateway
      if (filters.gateway !== 'all' && t.gateway !== filters.gateway) {
        return false;
      }

      // 5. Merchant
      if (filters.merchant !== 'all' && t.merchant.name !== filters.merchant) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  const handleViewDetails = (txn: TransactionRecord) => {
    setActiveDetailsTxn(txn);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/admin/transactions/${txn.id}`);
    }
  };

  const handleBackFromDetails = () => {
    setActiveDetailsTxn(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/admin/transactions');
    }
  };

  const handleRefund = (txn: TransactionRecord) => {
    setTransactions((prev) =>
      prev.map((item) =>
        item.id === txn.id
          ? {
              ...item,
              status: 'Refunded',
              isNegative: true,
              amount: item.amount.startsWith('-') ? item.amount : `- ${item.amount}`,
            }
          : item
      )
    );
    if (activeDetailsTxn && activeDetailsTxn.id === txn.id) {
      setActiveDetailsTxn((prev) =>
        prev
          ? {
              ...prev,
              status: 'Refunded',
              isNegative: true,
              amount: prev.amount.startsWith('-') ? prev.amount : `- ${prev.amount}`,
            }
          : null
      );
    }
    toast.success(`Transaction ${txn.id} has been marked as Refunded`);
  };

  // If a transaction is active, render full-page TransactionDetailsView
  if (activeDetailsTxn) {
    return (
      <TransactionDetailsView
        transaction={activeDetailsTxn}
        onBack={handleBackFromDetails}
        onRefund={handleRefund}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Transactions
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            Track and manage all financial transactions across the platform.
          </p>
        </div>

        {/* Right: Actions (Date picker, Export, Filters) */}
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
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Filters Button */}
          <button
            type="button"
            onClick={() => toast.info('Advanced filter options')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards (5 Cards) */}
      <TransactionsKpiCards kpis={TRANSACTIONS_KPIS} />

      {/* 3. Middle Main Content (Left Table + Right Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Filter Bar + Main Transactions Table (8 cols on lg, 9 on xl) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <TransactionsFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onOpenAdvancedFilters={() => toast.info('Advanced filters modal')}
          />

          <TransactionsTable
            transactions={filteredTransactions}
            onViewDetails={handleViewDetails}
            onRefundTransaction={handleRefund}
          />
        </div>

        {/* Right Column: 4 Sidebar Widgets (4 cols on lg, 3 on xl) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <TransactionOverviewDonutCard />
          <RevenueByGatewayCard />
          <TopMerchantsRevenueCard />
          <TransactionQuickActionsCard
            onOpenPayouts={() => setIsPayoutsOpen(true)}
            onOpenRefunds={() => setIsRefundsOpen(true)}
          />
        </div>
      </div>

      {/* 4. Modals */}
      <ExportTransactionsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        totalCount={transactions.length}
      />

      <PayoutsModal
        isOpen={isPayoutsOpen}
        onClose={() => setIsPayoutsOpen(false)}
      />

      <RefundRequestsModal
        isOpen={isRefundsOpen}
        onClose={() => setIsRefundsOpen(false)}
      />
    </div>
  );
}
