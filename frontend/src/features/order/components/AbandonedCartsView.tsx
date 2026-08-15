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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetMerchantAbandonedCartsQuery,
  useSendRecoverySmsMutation,
  type AbandonedCart,
} from '../api/orderApi';
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

/**
 * Only Overview is implemented in this release. The remaining tabs are declared
 * so navigation stays intact and each can be built out without restructuring.
 */
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'recovered', label: 'Recovered Carts' },
  { key: 'sms-templates', label: 'SMS Templates' },
  { key: 'settings', label: 'Settings' },
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

  // ---- URL-backed state, so refresh and back/forward preserve the view ----
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

  const {
    data: carts = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMerchantAbandonedCartsQuery();

  const [sendRecoverySms] = useSendRecoverySmsMutation();

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

  // Debounce the search box so typing does not push a URL entry per keystroke.
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

  /**
   * The API returns the merchant's full cart list rather than a paged, filtered
   * endpoint, so search, status, date range and pagination are all applied here
   * over the same array the KPIs are computed from.
   */
  const filteredCarts = useMemo(() => {
    const needle = searchParam.trim().toLowerCase();
    const days = DATE_RANGE_DAYS[dateRangeParam] ?? null;
    const cutoff = days === null ? null : Date.now() - days * 24 * 60 * 60 * 1000;

    return carts.filter((cart) => {
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
  }, [carts, searchParam, statusParam, dateRangeParam]);

  // Newest carts first — the freshest abandonment is the most recoverable.
  const sortedCarts = useMemo(
    () =>
      [...filteredCarts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [filteredCarts],
  );

  const summary = useMemo(() => buildSummary(sortedCarts), [sortedCarts]);
  const trend = useMemo(() => buildTrend(sortedCarts), [sortedCarts]);

  const total = sortedCarts.length;
  const totalPages = Math.max(1, Math.ceil(total / limitParam));
  const currentPage = Math.min(pageParam, totalPages);

  const pagedCarts = useMemo(
    () => sortedCarts.slice((currentPage - 1) * limitParam, currentPage * limitParam),
    [sortedCarts, currentPage, limitParam],
  );

  const selectedCart = useMemo(
    () => carts.find((cart) => cart.id === selectedCartId) ?? null,
    [carts, selectedCartId],
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

  const handleSendSms = async (cart: AbandonedCart) => {
    setSendingCartId(cart.id);
    try {
      await sendRecoverySms(cart.id).unwrap();
      toast.success(`Recovery SMS sent to ${cart.customerPhone}.`);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not send the recovery SMS.';
      toast.error(message);
    } finally {
      setSendingCartId(null);
    }
  };

  /**
   * Exports exactly the filtered set as CSV. There is no server-side export for
   * abandoned carts, so the file is built from the rows already on screen.
   */
  const handleExport = () => {
    if (sortedCarts.length === 0) {
      toast.error('There is nothing to export.');
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        'Customer',
        'Phone',
        'Email',
        'Items',
        'Cart Value',
        'Abandoned At',
        'Status',
        'Last Reminded',
      ];

      const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

      const rows = sortedCarts.map((cart) =>
        [
          cart.customerName || 'Anonymous Customer',
          cart.customerPhone,
          cart.customerEmail || '',
          String(getItemCount(cart.itemsJson)),
          formatCurrency(cart.totalAmount),
          `${formatDate(cart.createdAt)} ${formatTime(cart.createdAt)}`,
          STATUS_STYLES[getCartStatus(cart)].label,
          cart.lastRemindedAt ? formatDate(cart.lastRemindedAt) : 'Not reminded',
        ]
          .map(escapeCell)
          .join(','),
      );

      const csv = [headers.map(escapeCell).join(','), ...rows].join('\n');
      // The BOM keeps Bengali text and the ৳ symbol readable when Excel opens it.
      const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `abandoned-carts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Abandoned carts exported successfully.');
    } catch {
      toast.error('Failed to export abandoned carts.');
    } finally {
      setIsExporting(false);
    }
  };

  const errorStatus = (error as { status?: number } | undefined)?.status;
  const errorMessage =
    errorStatus === 401
      ? 'Your session has expired. Please sign in again.'
      : errorStatus === 403
        ? 'You do not have permission to view abandoned carts.'
        : errorStatus === 400
          ? 'Create a store before tracking abandoned carts.'
          : 'We could not load abandoned carts. Please try again.';

  // Windowed page numbers: 1 … current-1, current, current+1 … last
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
    <div className="space-y-5 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Abandoned Carts
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Recover lost sales by reaching out to customers who left items in their cart
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" aria-hidden="true" />
            ) : (
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <nav aria-label="Abandoned cart sections" className="border-b border-slate-200">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <li key={tab.key}>
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => updateUrlParams({ tab: tab.key === 'overview' ? null : tab.key })}
                  className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t ${
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

      {activeTab !== 'overview' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-12 text-center">
          <p className="text-sm font-bold text-slate-900">
            {TABS.find((t) => t.key === activeTab)?.label}
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            This section is not part of the current release yet.
          </p>
          <button
            type="button"
            onClick={() => updateUrlParams({ tab: null })}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Back to Overview
          </button>
        </div>
      ) : (
        /* 3. MAIN GRID — workspace ~80%, analytics rail ~20%. */
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
          <div className="space-y-5 min-w-0">
            <AbandonedCartKpiCards
              summary={summary}
              isLoading={isLoading}
              periodLabel={periodLabel}
            />

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
                      placeholder="Search by customer, email or phone..."
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

              {/* TABLE / ERROR STATE */}
              {isError ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-sm font-bold text-slate-900">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <AbandonedCartTable
                  carts={pagedCarts}
                  isLoading={isLoading}
                  hasActiveFilters={hasActiveFilters}
                  sendingCartId={sendingCartId}
                  onClearFilters={handleClearFilters}
                  onSendSms={handleSendSms}
                  onViewCart={setSelectedCartId}
                />
              )}

              {/* PAGINATION */}
              {!isError && total > 0 && (
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {rangeStart} to {rangeEnd} of {total.toLocaleString('en-US')} results
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
                              ? 'bg-emerald-600 text-white'
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

          {/* 4. RIGHT ANALYTICS RAIL */}
          <aside className="space-y-5 min-w-0">
            <AbandonmentTrendCard trend={trend} isLoading={isLoading} />
            <RecoveryBreakdownCard
              summary={summary}
              totalCarts={total}
              isLoading={isLoading}
            />

            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
              <h2 className="text-xs font-extrabold text-slate-900 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => updateUrlParams({ status: 'ABANDONED', page: '1' })}
                  className="w-full px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Show not-yet-reminded
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Export report
                </button>
              </div>
            </section>
          </aside>
        </div>
      )}

      <AbandonedCartDetailsDrawer
        cart={selectedCart}
        isSending={sendingCartId === selectedCart?.id}
        onClose={() => setSelectedCartId(null)}
        onSendSms={handleSendSms}
      />
    </div>
  );
};
