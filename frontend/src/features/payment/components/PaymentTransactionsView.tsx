'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Calendar,
  SlidersHorizontal,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetPaymentTransactionsQuery,
  useGetPaymentSummaryQuery,
  useGetPaymentGatewaysQuery,
  type ListPaymentTransactionsParams,
  type PaymentDateRangePreset,
  type PaymentGatewayCode,
  type PaymentMethodType,
  type PaymentTransactionStatus,
} from '../api/paymentApi';
import { PaymentKpiCards } from './PaymentKpiCards';
import { PaymentOverviewCard } from './PaymentOverviewCard';
import { TopPaymentMethodsCard } from './TopPaymentMethodsCard';
import { PaymentGatewaysCard } from './PaymentGatewaysCard';
import { PaymentTransactionsTable } from './PaymentTransactionsTable';
import { PaymentDetailsDrawer } from './PaymentDetailsDrawer';

const TABS = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'refunds', label: 'Refunds' },
  { key: 'methods', label: 'Payment Methods' },
  { key: 'gateways', label: 'Gateways' },
  { key: 'webhooks', label: 'Webhooks' },
] as const;

const DATE_RANGES: Array<{ value: PaymentDateRangePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
];

const STATUS_OPTIONS: Array<{ value: PaymentTransactionStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Status' },
  { value: 'COMPLETED', label: 'Paid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const METHOD_OPTIONS: Array<{ value: PaymentMethodType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Methods' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'ROCKET', label: 'Rocket' },
  { value: 'UPAY', label: 'Upay' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'COD', label: 'Cash on Delivery' },
];

const PAGE_SIZES = [10, 20, 50, 100];

const selectClass =
  'h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-slate-50 transition-colors appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-[length:14px] bg-[right_0.6rem_center] bg-no-repeat';

/** The merchant's own timezone, so "today" means their calendar day. */
const resolveTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
  } catch {
    return 'Asia/Dhaka';
  }
};

export const PaymentTransactionsView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- URL-backed state, so refresh and back/forward preserve the view ----
  const activeTab = searchParams.get('tab') || 'transactions';
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const limitParam = Number(searchParams.get('limit')) || 10;
  const searchParam = searchParams.get('search') || '';
  const statusParam = (searchParams.get('status') || 'ALL') as PaymentTransactionStatus | 'ALL';
  const gatewayParam = (searchParams.get('gateway') || 'ALL') as PaymentGatewayCode | 'ALL';
  const methodParam = (searchParams.get('method') || 'ALL') as PaymentMethodType | 'ALL';
  const dateRangeParam = (searchParams.get('dateRange') || '30d') as PaymentDateRangePreset;
  const dateFromParam = searchParams.get('dateFrom') || '';
  const dateToParam = searchParams.get('dateTo') || '';
  const minAmountParam = searchParams.get('minAmount') || '';
  const maxAmountParam = searchParams.get('maxAmount') || '';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const updateUrlParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'ALL') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchParam) {
        updateUrlParams({ search: searchInput || null, page: '1' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, searchParam, updateUrlParams]);

  // Keep the input in step when the URL changes from elsewhere (back button).
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const timezone = useMemo(() => resolveTimezone(), []);

  // A single query object drives the table, the KPIs and the charts, so every
  // panel always describes exactly the same filtered record set.
  const queryParams: ListPaymentTransactionsParams = useMemo(() => {
    const params: ListPaymentTransactionsParams = {
      page: pageParam,
      limit: limitParam,
      dateRange: dateRangeParam,
      timezone,
    };
    if (searchParam) params.search = searchParam;
    if (statusParam !== 'ALL') params.status = statusParam;
    if (gatewayParam !== 'ALL') params.gateway = gatewayParam;
    if (methodParam !== 'ALL') params.paymentMethod = methodParam;
    if (dateRangeParam === 'custom') {
      if (dateFromParam) params.dateFrom = dateFromParam;
      if (dateToParam) params.dateTo = dateToParam;
    }
    if (minAmountParam) params.minAmount = Number(minAmountParam);
    if (maxAmountParam) params.maxAmount = Number(maxAmountParam);
    return params;
  }, [
    pageParam,
    limitParam,
    searchParam,
    statusParam,
    gatewayParam,
    methodParam,
    dateRangeParam,
    dateFromParam,
    dateToParam,
    minAmountParam,
    maxAmountParam,
    timezone,
  ]);

  // The summary ignores pagination — it describes the whole filtered period.
  const summaryParams = useMemo(() => {
    const { page, limit, ...rest } = queryParams;
    return rest;
  }, [queryParams]);

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    isFetching: isTransactionsFetching,
    isError: isTransactionsError,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useGetPaymentTransactionsQuery(queryParams);

  const { data: summary, isLoading: isSummaryLoading } =
    useGetPaymentSummaryQuery(summaryParams);

  const { data: gateways } = useGetPaymentGatewaysQuery();

  const transactions = transactionsData?.data ?? [];
  const meta = transactionsData?.meta ?? { page: 1, limit: limitParam, total: 0, totalPages: 0 };

  const hasActiveFilters =
    Boolean(searchParam) ||
    statusParam !== 'ALL' ||
    gatewayParam !== 'ALL' ||
    methodParam !== 'ALL' ||
    dateRangeParam !== '30d' ||
    Boolean(minAmountParam) ||
    Boolean(maxAmountParam);

  const handleClearFilters = () => {
    setSearchInput('');
    router.push(pathname, { scroll: false });
  };

  const periodLabel = useMemo(() => {
    const match = DATE_RANGES.find((r) => r.value === dateRangeParam);
    if (dateRangeParam === 'today') return 'vs yesterday';
    if (dateRangeParam === 'custom') return 'vs previous period';
    return `from last ${match?.label.replace('Last ', '').toLowerCase() ?? '30 days'}`;
  }, [dateRangeParam]);

  /**
   * Exports the currently filtered set. The same query parameters go to the
   * export endpoint, so the file can never contain unrelated records.
   */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      Object.entries(summaryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });

      const apiRoot =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/(orders|payments)$/, '') ||
        'http://localhost:5001/api/v1';

      const token =
        typeof window !== 'undefined' ? localStorage.getItem('easycommerce_token') : null;
      const activeStoreId =
        typeof window !== 'undefined'
          ? localStorage.getItem('easycommerce_active_store_id')
          : null;

      const headers: Record<string, string> = {};
      if (token) headers['authorization'] = `Bearer ${token}`;
      if (activeStoreId) headers['x-store-id'] = activeStoreId;

      const response = await fetch(
        `${apiRoot}/payments/transactions/export?${params.toString()}`,
        { headers },
      );

      if (response.status === 403) {
        toast.error('You do not have permission to export payments.');
        return;
      }
      if (!response.ok) throw new Error('Export request failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `payment-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Payment transactions exported successfully.');
    } catch {
      toast.error('Failed to export payment transactions.');
    } finally {
      setIsExporting(false);
    }
  };

  const errorStatus = (transactionsError as { status?: number } | undefined)?.status;
  const errorMessage =
    errorStatus === 401
      ? 'Your session has expired. Please sign in again.'
      : errorStatus === 403
        ? 'You do not have permission to view payment transactions.'
        : errorStatus === 400
          ? 'Create a store before viewing payments.'
          : 'We could not load payment transactions. Please try again.';

  // Windowed page numbers: 1 … current-1, current, current+1 … last
  const pageNumbers = useMemo(() => {
    const total = meta.totalPages;
    if (total <= 1) return [] as Array<number | 'gap'>;
    const pages = new Set<number>([1, total, meta.page, meta.page - 1, meta.page + 1, 2, 3]);
    const sorted = Array.from(pages)
      .filter((p) => p >= 1 && p <= total)
      .sort((a, b) => a - b);

    const result: Array<number | 'gap'> = [];
    sorted.forEach((page, index) => {
      if (index > 0 && page - (sorted[index - 1] as number) > 1) result.push('gap');
      result.push(page);
    });
    return result;
  }, [meta.page, meta.totalPages]);

  const rangeStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const rangeEnd = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Manage your payment transactions, gateways and refunds
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" aria-hidden="true" />
            ) : (
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          <Link
            href="/dashboard/settings/payment"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            Settings
          </Link>
        </div>
      </div>

      {/* 2. PAYMENT NAVIGATION TABS */}
      <nav aria-label="Payment sections" className="border-b border-slate-200">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <li key={tab.key}>
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() =>
                    updateUrlParams({ tab: tab.key === 'transactions' ? null : tab.key })
                  }
                  className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {activeTab !== 'transactions' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-12 text-center">
          <p className="text-sm font-bold text-slate-900">
            {TABS.find((t) => t.key === activeTab)?.label}
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            This section is not part of the Transactions release yet.
          </p>
          <button
            type="button"
            onClick={() => updateUrlParams({ tab: null })}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Back to Transactions
          </button>
        </div>
      ) : (
        /* 3. MAIN GRID — workspace ~75-80%, analytics rail ~20-25% */
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 items-start">
          <div className="xl:col-span-3 space-y-5 min-w-0">
            <PaymentKpiCards
              summary={summary}
              isLoading={isSummaryLoading}
              periodLabel={periodLabel}
            />

            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              {/* FILTER BAR */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search payment, order, customer or transaction ID..."
                      aria-label="Search payments"
                      className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative flex items-center">
                      <Calendar
                        className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10"
                        aria-hidden="true"
                      />
                      <select
                        value={dateRangeParam}
                        onChange={(e) =>
                          updateUrlParams({ dateRange: e.target.value, page: '1' })
                        }
                        aria-label="Filter by date range"
                        className={`${selectClass} !pl-8`}
                      >
                        {DATE_RANGES.map((range) => (
                          <option key={range.value} value={range.value}>
                            Date: {range.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <select
                      value={statusParam}
                      onChange={(e) => updateUrlParams({ status: e.target.value, page: '1' })}
                      aria-label="Filter by payment status"
                      className={selectClass}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={gatewayParam}
                      onChange={(e) => updateUrlParams({ gateway: e.target.value, page: '1' })}
                      aria-label="Filter by gateway"
                      className={selectClass}
                    >
                      <option value="ALL">All Gateways</option>
                      {(gateways ?? []).map((gateway) => (
                        <option key={gateway.id} value={gateway.code}>
                          {gateway.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen((prev) => !prev)}
                      aria-expanded={isFiltersOpen}
                      className={`h-9 px-3 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isFiltersOpen || minAmountParam || maxAmountParam || methodParam !== 'ALL'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                      Filters
                    </button>
                  </div>
                </div>

                {/* ADVANCED FILTERS */}
                {isFiltersOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className="block">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Payment Method
                      </span>
                      <select
                        value={methodParam}
                        onChange={(e) => updateUrlParams({ method: e.target.value, page: '1' })}
                        className={`${selectClass} w-full`}
                      >
                        {METHOD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Min Amount
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={minAmountParam}
                        onChange={(e) =>
                          updateUrlParams({ minAmount: e.target.value || null, page: '1' })
                        }
                        placeholder="0"
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Max Amount
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={maxAmountParam}
                        onChange={(e) =>
                          updateUrlParams({ maxAmount: e.target.value || null, page: '1' })
                        }
                        placeholder="Any"
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </label>

                    {dateRangeParam === 'custom' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            From
                          </span>
                          <input
                            type="date"
                            value={dateFromParam}
                            onChange={(e) =>
                              updateUrlParams({ dateFrom: e.target.value || null, page: '1' })
                            }
                            className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          />
                        </label>
                        <label className="block">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            To
                          </span>
                          <input
                            type="date"
                            value={dateToParam}
                            onChange={(e) =>
                              updateUrlParams({ dateTo: e.target.value || null, page: '1' })
                            }
                            className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-end">
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={handleClearFilters}
                            className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                            Clear Filters
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TABLE / ERROR STATE */}
              {isTransactionsError ? (
                <div className="p-12 text-center">
                  <AlertCircle
                    className="w-8 h-8 text-red-500 mx-auto mb-3"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-bold text-slate-900">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => refetchTransactions()}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <PaymentTransactionsTable
                  transactions={transactions}
                  isLoading={isTransactionsLoading || isTransactionsFetching}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
                  onViewPayment={setSelectedPaymentId}
                />
              )}

              {/* PAGINATION */}
              {!isTransactionsError && meta.total > 0 && (
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {rangeStart} to {rangeEnd} of {meta.total.toLocaleString('en-US')}{' '}
                    results
                  </p>

                  <nav
                    aria-label="Transaction pagination"
                    className="flex items-center gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => updateUrlParams({ page: String(meta.page - 1) })}
                      disabled={meta.page <= 1}
                      aria-label="Previous page"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {pageNumbers.map((page, index) =>
                      page === 'gap' ? (
                        <span
                          key={`gap-${index}`}
                          className="px-1 text-xs font-bold text-slate-400"
                          aria-hidden="true"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => updateUrlParams({ page: String(page) })}
                          aria-current={page === meta.page ? 'page' : undefined}
                          aria-label={`Page ${page}`}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            page === meta.page
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() => updateUrlParams({ page: String(meta.page + 1) })}
                      disabled={meta.page >= meta.totalPages}
                      aria-label="Next page"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <select
                      value={limitParam}
                      onChange={(e) => updateUrlParams({ limit: e.target.value, page: '1' })}
                      aria-label="Results per page"
                      className={`${selectClass} ml-1.5 !h-8`}
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size} / page
                        </option>
                      ))}
                    </select>
                  </nav>
                </div>
              )}
            </section>
          </div>

          {/* 4. RIGHT ANALYTICS RAIL */}
          <aside className="xl:col-span-1 space-y-5 min-w-0">
            <PaymentOverviewCard summary={summary} isLoading={isSummaryLoading} />
            <TopPaymentMethodsCard
              methods={summary?.topPaymentMethods}
              currency={summary?.currency ?? 'BDT'}
              isLoading={isSummaryLoading}
            />
            <PaymentGatewaysCard
              gateways={gateways ?? summary?.gateways}
              isLoading={isSummaryLoading && !gateways}
            />
          </aside>
        </div>
      )}

      <PaymentDetailsDrawer
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
      />
    </div>
  );
};
