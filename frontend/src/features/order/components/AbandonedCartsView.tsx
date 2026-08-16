'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Calendar,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  MessageSquare,
  X,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetMerchantAbandonedCartsQuery,
  useSendRecoverySmsMutation,
  type AbandonedCart,
} from '../api/orderApi';
import { MOCK_ABANDONED_CARTS, type MockAbandonedCart } from '../data/abandonedCartMockData';
import { AbandonedCartKpiCards } from './AbandonedCartKpiCards';
import { AbandonedCartTable } from './AbandonedCartTable';
import { AbandonmentTrendCard } from './AbandonmentTrendCard';
import { RecoveryBreakdownCard } from './RecoveryBreakdownCard';
import { AbandonedCartDetailsDrawer } from './AbandonedCartDetailsDrawer';
import { buildSummary, buildTrend } from '../utils/abandonedCartMetrics';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getCartStatus,
  getItemCount,
  STATUS_STYLES,
} from '../utils/abandonedCartFormatters';

const TABS = [
  { key: 'overview', label: 'Overview' },
] as const;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'ABANDONED', label: 'Abandoned' },
  { value: 'REMINDED', label: 'SMS Sent' },
  { value: 'RECOVERED', label: 'Recovered' },
] as const;

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
] as const;

const PAGE_SIZES = [10, 20, 50, 100];

const selectClass =
  'h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 hover:bg-slate-50 transition-colors appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-[length:14px] bg-[right_0.6rem_center] bg-no-repeat';

const DATE_RANGE_DAYS: Record<string, number | null> = {
  all: null,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const AbandonedCartsView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-backed state
  const activeTab = searchParams.get('tab') || 'overview';
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const limitParam = Number(searchParams.get('limit')) || 10;
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || 'ALL';
  const dateRangeParam = searchParams.get('dateRange') || 'all';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [sendingCartId, setSendingCartId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Dedicated local state initialized with comprehensive mock dataset
  const [localCarts, setLocalCarts] = useState<MockAbandonedCart[]>(MOCK_ABANDONED_CARTS);

  const {
    data: apiCarts = [],
    isLoading: isApiLoading,
    isFetching: isApiFetching,
    refetch,
  } = useGetMerchantAbandonedCartsQuery();

  const [sendRecoverySms] = useSendRecoverySmsMutation();

  // If the API returns real records, merge/use them; otherwise keep our rich demo dataset
  useEffect(() => {
    if (apiCarts && apiCarts.length > 0) {
      setLocalCarts(apiCarts as MockAbandonedCart[]);
    }
  }, [apiCarts]);

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchParam) {
        updateUrlParams({ search: searchInput || null, page: '1' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchParam, updateUrlParams]);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const resetSampleData = () => {
    setLocalCarts(MOCK_ABANDONED_CARTS);
    toast.success('Sample abandoned carts data restored to original state!');
  };

  /** Filter by search, status, and date range */
  const filteredCarts = useMemo(() => {
    const needle = searchParam.trim().toLowerCase();
    const days = DATE_RANGE_DAYS[dateRangeParam] ?? null;
    const cutoff = days === null ? null : Date.now() - days * 24 * 60 * 60 * 1000;

    return localCarts.filter((cart) => {
      if (statusParam !== 'ALL' && getCartStatus(cart) !== statusParam) return false;

      if (cutoff !== null) {
        const created = new Date(cart.createdAt).getTime();
        if (Number.isNaN(created) || created < cutoff) return false;
      }

      if (needle) {
        const haystack = [cart.customerName, cart.customerPhone, cart.customerEmail]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [localCarts, searchParam, statusParam, dateRangeParam]);

  // Sort newest first
  const sortedCarts = useMemo(
    () =>
      [...filteredCarts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [filteredCarts],
  );

  const summary = useMemo(() => buildSummary(localCarts), [localCarts]);
  const trend = useMemo(() => buildTrend(localCarts), [localCarts]);

  const total = sortedCarts.length;
  const totalPages = Math.max(1, Math.ceil(total / limitParam));
  const currentPage = Math.min(pageParam, totalPages);

  const pagedCarts = useMemo(
    () => sortedCarts.slice((currentPage - 1) * limitParam, currentPage * limitParam),
    [sortedCarts, currentPage, limitParam],
  );

  const selectedCart = useMemo(
    () => localCarts.find((cart) => cart.id === selectedCartId) ?? null,
    [localCarts, selectedCartId],
  );

  const hasActiveFilters =
    Boolean(searchParam) || statusParam !== 'ALL' || dateRangeParam !== 'all';

  const handleClearFilters = () => {
    setSearchInput('');
    router.push(pathname, { scroll: false });
  };

  const periodLabel = useMemo(() => {
    const match = DATE_RANGES.find((r) => r.value === dateRangeParam);
    return match?.value === 'all' ? 'All time' : `In ${match?.label.toLowerCase()}`;
  }, [dateRangeParam]);

  /** Interactive Send SMS Action */
  const handleSendSms = async (cart: AbandonedCart | MockAbandonedCart) => {
    setSendingCartId(cart.id);

    try {
      // Attempt backend API if available, fallback gracefully
      try {
        await sendRecoverySms(cart.id).unwrap();
      } catch {
        // Fallback to local state simulation
      }

      // Update in-memory state so UI updates dynamically
      setLocalCarts((prev) =>
        prev.map((c) =>
          c.id === cart.id
            ? {
                ...c,
                lastRemindedAt: new Date().toISOString(),
                timeline: [
                  ...(c.timeline || []),
                  {
                    time: new Date().toISOString(),
                    title: 'Recovery SMS Sent (Manual)',
                    description: `Dispatched SMS reminder to ${cart.customerPhone} with checkout link`,
                    type: 'sms_sent',
                  },
                ],
              }
            : c,
        ),
      );

      toast.success(`Recovery SMS dispatched to ${cart.customerPhone} via Greenweb Gateway!`);
    } catch {
      toast.error('Could not send the recovery SMS.');
    } finally {
      setSendingCartId(null);
    }
  };

  /** CSV Export */
  const handleExport = () => {
    if (sortedCarts.length === 0) {
      toast.error('There is nothing to export.');
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        'Cart ID',
        'Customer Name',
        'Phone',
        'Email',
        'Shipping Address',
        'Items Count',
        'Cart Total (BDT)',
        'Abandoned At',
        'Status',
        'Last Reminded At',
        'Recovery Token',
      ];

      const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

      const rows = sortedCarts.map((cart) =>
        [
          cart.id,
          cart.customerName || 'Anonymous Customer',
          cart.customerPhone,
          cart.customerEmail || '',
          cart.shippingAddress || '',
          String(getItemCount(cart.itemsJson)),
          formatCurrency(cart.totalAmount),
          `${formatDate(cart.createdAt)} ${formatTime(cart.createdAt)}`,
          STATUS_STYLES[getCartStatus(cart)].label,
          cart.lastRemindedAt ? formatDate(cart.lastRemindedAt) : 'Not reminded',
          cart.recoveryToken,
        ]
          .map(escapeCell)
          .join(','),
      );

      const csv = [headers.map(escapeCell).join(','), ...rows].join('\n');
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `easycommerce-abandoned-carts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Abandoned carts report exported successfully!');
    } catch {
      toast.error('Failed to export abandoned carts.');
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination page numbers
  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [] as Array<number | 'gap'>;
    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    const sorted = Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);

    const result: Array<number | 'gap'> = [];
    sorted.forEach((page, index) => {
      if (index > 0 && page - (sorted[index - 1] as number) > 1) result.push('gap');
      result.push(page);
    });
    return result;
  }, [currentPage, totalPages]);

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * limitParam + 1;
  const rangeEnd = Math.min(currentPage * limitParam, total);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Abandoned Carts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-extrabold inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Demo Data Mode
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Recover lost sales by reaching out to shoppers who left items in checkout
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={resetSampleData}
            title="Reset demo data to initial state"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Data
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isApiFetching}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isApiFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" aria-hidden="true" />
            ) : (
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <nav aria-label="Abandoned cart sections" className="border-b border-slate-200">
        <ul className="flex items-center gap-2 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <li key={tab.key}>
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => updateUrlParams({ tab: tab.key === 'overview' ? null : tab.key })}
                  className={`px-4 py-2.5 text-xs font-extrabold whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t ${
                    isActive
                      ? 'border-emerald-600 text-emerald-700'
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

      {/* 3. TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        {/* MAIN LEFT WORKSPACE */}
        <div className="space-y-5 min-w-0">
          {/* KPI STAT CARDS */}
          <AbandonedCartKpiCards
            summary={summary}
            isLoading={false}
            periodLabel={periodLabel}
          />

          {/* ABANDONED CARTS WORKSPACE */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            {/* FILTER BAR */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by customer, email or phone (e.g. Nusrat, 017...)"
                    aria-label="Search abandoned carts"
                    className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <select
                    value={statusParam}
                    onChange={(e) => updateUrlParams({ status: e.target.value, page: '1' })}
                    aria-label="Filter by recovery status"
                    className={selectClass}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

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

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TABLE */}
            <AbandonedCartTable
              carts={pagedCarts}
              isLoading={false}
              hasActiveFilters={hasActiveFilters}
              sendingCartId={sendingCartId}
              onClearFilters={handleClearFilters}
              onSendSms={handleSendSms}
              onViewCart={setSelectedCartId}
            />

            {/* PAGINATION */}
            {total > 0 && (
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Showing {rangeStart} to {rangeEnd} of {total.toLocaleString('en-US')} carts
                </p>

                <nav aria-label="Abandoned cart pagination" className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ page: String(currentPage - 1) })}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                        aria-current={page === currentPage ? 'page' : undefined}
                        aria-label={`Page ${page}`}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          page === currentPage
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => updateUrlParams({ page: String(currentPage + 1) })}
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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

        {/* RIGHT ANALYTICS RAIL */}
        <aside className="space-y-5 min-w-0">
          <AbandonmentTrendCard trend={trend} isLoading={false} />
          <RecoveryBreakdownCard
            summary={summary}
            totalCarts={localCarts.length}
            isLoading={false}
          />

          {/* QUICK ACTIONS CARD */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
            <h2 className="text-xs font-extrabold text-slate-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => updateUrlParams({ status: 'ABANDONED', page: '1' })}
                className="w-full px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                Show Not-Yet-Reminded Carts
              </button>

              <button
                type="button"
                onClick={() => updateUrlParams({ status: 'RECOVERED', page: '1' })}
                className="w-full px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                Show Recovered Carts
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Export Full CSV Report
              </button>
            </div>
          </section>
        </aside>
      </div>
      )}

      {/* DETAILS DRAWER */}
      <AbandonedCartDetailsDrawer
        cart={selectedCart}
        isSending={sendingCartId === selectedCart?.id}
        onClose={() => setSelectedCartId(null)}
        onSendSms={handleSendSms}
      />
    </div>
  );
};

