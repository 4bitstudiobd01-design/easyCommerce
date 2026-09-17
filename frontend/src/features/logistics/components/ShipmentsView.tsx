'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Calendar,
  SlidersHorizontal,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useGetShipmentsQuery,
  useGetShipmentSummaryQuery,
  useGetCourierProvidersQuery,
  useCancelShipmentMutation,
  useSyncShipmentMutation,
  type Shipment,
  type ShipmentFilters,
  type ShipmentStatus,
  type CodStatus,
  type CourierProvider,
  type ShipmentDateRangePreset,
} from '../api/logisticsApi';
import { ShipmentKpiCards } from './ShipmentKpiCards';
import { ShipmentTable } from './ShipmentTable';
import { ShipmentOverviewCard } from './ShipmentOverviewCard';
import { CourierPerformanceCard } from './CourierPerformanceCard';
import { CodSummaryCard } from './CodSummaryCard';
import { QuickActionsCard } from './QuickActionsCard';
import { ShipmentDetailsDrawer } from './ShipmentDetailsDrawer';
import { CreateShipmentDrawer } from './CreateShipmentDrawer';
import { CouriersView } from './CouriersView';
import { resolveTimezone } from '../utils/shipmentFormatters';

/**
 * The Courier module's active tabs.
 */
const TABS = [
  { key: 'shipments', label: 'Shipments' },
  { key: 'couriers', label: 'Couriers' },
] as const;

const DATE_RANGES: Array<{ value: ShipmentDateRangePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom Range' },
];

const STATUS_OPTIONS: Array<{ value: ShipmentStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'DELIVERY_FAILED', label: 'Failed Delivery' },
  { value: 'RETURNING', label: 'Returning' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const COD_STATUS_OPTIONS: Array<{ value: CodStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All COD Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COLLECTED', label: 'Collected' },
  { value: 'SETTLED', label: 'Settled' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'NOT_APPLICABLE', label: 'Prepaid' },
];

const PAGE_SIZES = [10, 20, 50, 100];

const selectClass =
  'h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-slate-50 transition-colors appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-[length:14px] bg-[right_0.6rem_center] bg-no-repeat';

export const ShipmentsView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- URL-backed state, so refresh and back/forward preserve the view ----
  const activeTab = searchParams.get('tab') || 'shipments';
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const limitParam = Number(searchParams.get('limit')) || 10;
  const searchParam = searchParams.get('search') || '';
  const statusParam = (searchParams.get('status') || 'ALL') as ShipmentStatus | 'ALL';
  const courierParam = (searchParams.get('courier') || 'ALL') as CourierProvider | 'ALL';
  const codStatusParam = (searchParams.get('codStatus') || 'ALL') as CodStatus | 'ALL';
  const dateRangeParam = (searchParams.get('dateRange') || '30d') as ShipmentDateRangePreset;
  const dateFromParam = searchParams.get('dateFrom') || '';
  const dateToParam = searchParams.get('dateTo') || '';
  const cityParam = searchParams.get('city') || '';
  const minAmountParam = searchParams.get('minAmount') || '';
  const maxAmountParam = searchParams.get('maxAmount') || '';
  const minWeightParam = searchParams.get('minWeight') || '';
  const maxWeightParam = searchParams.get('maxWeight') || '';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [createDrawerMode, setCreateDrawerMode] = useState<'single' | 'bulk' | null>(null);

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

  // A single query object drives the table, the KPIs and the analytics rail, so
  // every panel always describes exactly the same filtered record set.
  const queryParams: ShipmentFilters = useMemo(() => {
    const params: ShipmentFilters = {
      page: pageParam,
      limit: limitParam,
      dateRange: dateRangeParam,
      timezone,
    };
    if (searchParam) params.search = searchParam;
    if (statusParam !== 'ALL') params.status = statusParam;
    if (courierParam !== 'ALL') params.courierProvider = courierParam;
    if (codStatusParam !== 'ALL') params.codStatus = codStatusParam;
    if (dateRangeParam === 'custom') {
      if (dateFromParam) params.dateFrom = dateFromParam;
      if (dateToParam) params.dateTo = dateToParam;
    }
    if (cityParam) params.city = cityParam;
    if (minAmountParam) params.minAmount = Number(minAmountParam);
    if (maxAmountParam) params.maxAmount = Number(maxAmountParam);
    if (minWeightParam) params.minWeight = Number(minWeightParam);
    if (maxWeightParam) params.maxWeight = Number(maxWeightParam);
    return params;
  }, [
    pageParam,
    limitParam,
    searchParam,
    statusParam,
    courierParam,
    codStatusParam,
    dateRangeParam,
    dateFromParam,
    dateToParam,
    cityParam,
    minAmountParam,
    maxAmountParam,
    minWeightParam,
    maxWeightParam,
    timezone,
  ]);

  // The summary ignores pagination — it describes the whole filtered period.
  const summaryParams = useMemo(() => {
    const { page, limit, ...rest } = queryParams;
    return rest;
  }, [queryParams]);

  const {
    data: shipmentsData,
    isLoading: isShipmentsLoading,
    isFetching: isShipmentsFetching,
    isError: isShipmentsError,
    error: shipmentsError,
    refetch: refetchShipments,
  } = useGetShipmentsQuery(queryParams);

  const { data: summary, isLoading: isSummaryLoading } =
    useGetShipmentSummaryQuery(summaryParams);

  const { data: couriers } = useGetCourierProvidersQuery();

  const [cancelShipment, { isLoading: isCancellingShipment }] = useCancelShipmentMutation();
  const [syncShipment] = useSyncShipmentMutation();

  const shipments = shipmentsData?.data ?? [];
  const meta = shipmentsData?.meta ?? { page: 1, limit: limitParam, total: 0, totalPages: 0 };

  const hasActiveFilters =
    Boolean(searchParam) ||
    statusParam !== 'ALL' ||
    courierParam !== 'ALL' ||
    codStatusParam !== 'ALL' ||
    dateRangeParam !== '30d' ||
    Boolean(cityParam) ||
    Boolean(minAmountParam) ||
    Boolean(maxAmountParam) ||
    Boolean(minWeightParam) ||
    Boolean(maxWeightParam);

  const handleClearFilters = () => {
    setSearchInput('');
    router.push(pathname, { scroll: false });
  };

  const periodLabel = useMemo(() => {
    const match = DATE_RANGES.find((r) => r.value === dateRangeParam);
    if (dateRangeParam === 'today') return 'vs yesterday';
    if (dateRangeParam === 'yesterday') return 'vs previous day';
    if (dateRangeParam === 'custom') return 'vs previous period';
    return `from last ${match?.label.replace('Last ', '').toLowerCase() ?? '30 days'}`;
  }, [dateRangeParam]);

  const performancePeriodLabel = useMemo(() => {
    const match = DATE_RANGES.find((r) => r.value === dateRangeParam);
    if (dateRangeParam === 'custom') return '(Selected Range)';
    return `(${match?.label ?? 'Last 30 days'})`;
  }, [dateRangeParam]);

  /**
   * Exports the currently filtered set. The same query parameters go to the
   * export endpoint, so the file can never contain unrelated shipments.
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
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/(orders|payments|logistics)$/, '') ||
        'http://localhost:5001/api/v1';

      const token =
        typeof window !== 'undefined' ? localStorage.getItem('bitcommerce_token') : null;
      const activeStoreId =
        typeof window !== 'undefined'
          ? localStorage.getItem('bitcommerce_active_store_id')
          : null;

      const headers: Record<string, string> = {};
      if (token) headers['authorization'] = `Bearer ${token}`;
      if (activeStoreId) headers['x-store-id'] = activeStoreId;

      const response = await fetch(
        `${apiRoot}/logistics/shipments/export?${params.toString()}`,
        { headers },
      );

      if (response.status === 403) {
        toast.error('You do not have permission to export shipments.');
        return;
      }
      if (!response.ok) throw new Error('Export request failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `shipments-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Shipments exported successfully.');
    } catch {
      toast.error('Failed to export shipments.');
    } finally {
      setIsExporting(false);
    }
  };

  const [shipmentPendingCancel, setShipmentPendingCancel] = useState<Shipment | null>(null);

  const handleCancelShipment = (shipment: Shipment) => {
    setShipmentPendingCancel(shipment);
  };

  const confirmCancelShipment = async () => {
    if (!shipmentPendingCancel) return;
    try {
      await cancelShipment({ id: shipmentPendingCancel.id }).unwrap();
      toast.success(`${shipmentPendingCancel.shipmentNumber} cancelled.`);
      setShipmentPendingCancel(null);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not cancel this shipment.';
      toast.error(message);
    }
  };

  const handleSyncShipment = async (shipment: Shipment) => {
    try {
      await syncShipment(shipment.id).unwrap();
      toast.success(`Tracking updated for ${shipment.shipmentNumber}.`);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not reach the courier.';
      toast.error(message);
    }
  };

  const errorStatus = (shipmentsError as { status?: number } | undefined)?.status;
  const errorMessage =
    errorStatus === 401
      ? 'Your session has expired. Please sign in again.'
      : errorStatus === 403
        ? 'You do not have permission to view shipments.'
        : errorStatus === 400
          ? 'Create a store before managing shipments.'
          : 'We could not load shipments. Please try again.';

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Courier</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Manage shipments, track deliveries and courier providers
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

          <button
            type="button"
            onClick={() => setCreateDrawerMode('single')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Create Shipment
          </button>
        </div>
      </div>

      {/* 2. COURIER NAVIGATION TABS */}
      <nav aria-label="Courier sections" className="border-b border-slate-200">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <li key={tab.key}>
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() =>
                    updateUrlParams({ tab: tab.key === 'shipments' ? null : tab.key })
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

      {activeTab === 'couriers' ? (
        <CouriersView />
      ) : (
        /* 3. MAIN GRID — workspace ~80%, analytics rail ~20%. The rail is fixed
              so the shipment table keeps the width its nine columns need. */
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
          <div className="space-y-5 min-w-0">
            <ShipmentKpiCards
              summary={summary}
              isLoading={isSummaryLoading}
              periodLabel={periodLabel}
            />

            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              {/* FILTER BAR */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                  {/* Search keeps a usable minimum width instead of collapsing
                      to a few characters once the filters wrap beside it. */}
                  <div className="relative flex-1 min-w-[220px]">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search order ID, tracking ID, customer or phone..."
                      aria-label="Search shipments"
                      className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <select
                      value={courierParam}
                      onChange={(e) => updateUrlParams({ courier: e.target.value, page: '1' })}
                      aria-label="Filter by courier"
                      className={selectClass}
                    >
                      <option value="ALL">All Couriers</option>
                      {(couriers ?? []).map((courier) => (
                        <option key={courier.code} value={courier.code}>
                          {courier.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusParam}
                      onChange={(e) => updateUrlParams({ status: e.target.value, page: '1' })}
                      aria-label="Filter by shipment status"
                      className={selectClass}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={codStatusParam}
                      onChange={(e) => updateUrlParams({ codStatus: e.target.value, page: '1' })}
                      aria-label="Filter by COD status"
                      className={selectClass}
                    >
                      {COD_STATUS_OPTIONS.map((option) => (
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

                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen((prev) => !prev)}
                      aria-expanded={isFiltersOpen}
                      className={`h-9 px-3 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isFiltersOpen ||
                        cityParam ||
                        minAmountParam ||
                        maxAmountParam ||
                        minWeightParam ||
                        maxWeightParam
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
                        Delivery Area
                      </span>
                      <input
                        type="text"
                        value={cityParam}
                        onChange={(e) =>
                          updateUrlParams({ city: e.target.value || null, page: '1' })
                        }
                        placeholder="Any city"
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Min COD
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
                          Max COD
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
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Min Weight
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={minWeightParam}
                          onChange={(e) =>
                            updateUrlParams({ minWeight: e.target.value || null, page: '1' })
                          }
                          placeholder="kg"
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Max Weight
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={maxWeightParam}
                          onChange={(e) =>
                            updateUrlParams({ maxWeight: e.target.value || null, page: '1' })
                          }
                          placeholder="kg"
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        />
                      </label>
                    </div>

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
              {isShipmentsError ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-sm font-bold text-slate-900">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => refetchShipments()}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <ShipmentTable
                  shipments={shipments}
                  isLoading={isShipmentsLoading || isShipmentsFetching}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
                  onViewShipment={setSelectedShipmentId}
                  onCancelShipment={handleCancelShipment}
                  onSyncShipment={handleSyncShipment}
                  onCreateShipment={() => setCreateDrawerMode('single')}
                />
              )}

              {/* PAGINATION */}
              {!isShipmentsError && meta.total > 0 && (
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {rangeStart} to {rangeEnd} of {meta.total.toLocaleString('en-US')}{' '}
                    results
                  </p>

                  <nav aria-label="Shipment pagination" className="flex items-center gap-1.5">
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
            <ShipmentOverviewCard
              summary={summary}
              isLoading={isSummaryLoading}
            />
            <CourierPerformanceCard
              couriers={summary?.courierPerformance}
              isLoading={isSummaryLoading}
              periodLabel={performancePeriodLabel}
              onViewAll={() => updateUrlParams({ tab: 'couriers' })}
            />
            <CodSummaryCard
              codSummary={summary?.codSummary}
              currency={summary?.currency ?? 'BDT'}
              isLoading={isSummaryLoading}
            />
            <QuickActionsCard
              onCreateShipment={() => setCreateDrawerMode('single')}
              onBulkShipment={() => setCreateDrawerMode('bulk')}
              onDownloadManifest={handleExport}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </aside>
        </div>
      )}

      <ShipmentDetailsDrawer
        shipmentId={selectedShipmentId}
        onClose={() => setSelectedShipmentId(null)}
      />

      <CreateShipmentDrawer
        isOpen={createDrawerMode !== null}
        mode={createDrawerMode ?? 'single'}
        onClose={() => setCreateDrawerMode(null)}
      />

      <ConfirmDialog
        isOpen={shipmentPendingCancel !== null}
        onClose={() => setShipmentPendingCancel(null)}
        onConfirm={confirmCancelShipment}
        title="Cancel Shipment"
        message={
          <>
            Cancel shipment <strong>{shipmentPendingCancel?.shipmentNumber}</strong>? The courier
            booking will be cancelled.
          </>
        }
        confirmLabel="Cancel Shipment"
        cancelLabel="Keep Shipment"
        isLoading={isCancellingShipment}
      />
    </div>
  );
};
