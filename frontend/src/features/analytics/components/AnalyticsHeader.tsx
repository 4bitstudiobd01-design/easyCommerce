'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, Download, Check } from 'lucide-react';
import {
  useAnalyticsFilters,
  type RangePresetKey,
  type CompareKey,
} from '../context/AnalyticsFiltersContext';
import {
  useGetAnalyticsKpiSummaryQuery,
  useGetAnalyticsOverviewQuery,
  useGetTrafficSourcesQuery,
} from '../api/analyticsApi';

const RANGE_OPTIONS: { key: RangePresetKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'last90', label: 'Last 90 days' },
  { key: 'thisMonth', label: 'This month' },
];

const COMPARE_OPTIONS: { key: CompareKey; label: string }[] = [
  { key: 'previous', label: 'Previous period' },
  { key: 'previousYear', label: 'Previous year' },
  { key: 'none', label: 'No comparison' },
];

function useOutsideClick(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

function toCsvRow(cells: (string | number)[]): string {
  return cells
    .map((c) => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(',');
}

export function AnalyticsHeader() {
  const filters = useAnalyticsFilters();
  const dateParams = { dateFrom: filters.dateFrom, dateTo: filters.dateTo };

  const [rangeOpen, setRangeOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const rangeRef = useOutsideClick(() => setRangeOpen(false));
  const compareRef = useOutsideClick(() => setCompareOpen(false));

  // Data for the Export button — same queries the cards use, so they're cache hits.
  const { data: kpi } = useGetAnalyticsKpiSummaryQuery(dateParams);
  const { data: overview } = useGetAnalyticsOverviewQuery(dateParams);
  const { data: traffic } = useGetTrafficSourcesQuery(dateParams);

  const handleExport = () => {
    const lines: string[] = [];
    lines.push(toCsvRow(['Analytics export']));
    lines.push(toCsvRow(['Range', filters.rangeLabel]));
    lines.push(
      toCsvRow([
        'From',
        new Date(filters.dateFrom).toISOString().slice(0, 10),
        'To',
        new Date(filters.dateTo).toISOString().slice(0, 10),
      ]),
    );
    lines.push('');

    if (kpi) {
      lines.push(toCsvRow(['KPI', 'Value']));
      lines.push(toCsvRow(['Total Revenue', kpi.totalRevenue]));
      lines.push(toCsvRow(['Total Orders', kpi.totalOrders]));
      lines.push(toCsvRow(['Average Order Value', kpi.averageOrderValue]));
      lines.push(toCsvRow(['Total Customers', kpi.totalCustomers]));
      lines.push(toCsvRow(['Conversion Rate %', kpi.conversionRate ?? '']));
      lines.push(toCsvRow(['Total Refunded', kpi.totalRefunded]));
      lines.push('');
    }

    if (overview?.dailyRevenueTrend?.length) {
      lines.push(toCsvRow(['Date', 'Revenue', 'Orders']));
      overview.dailyRevenueTrend.forEach((p) =>
        lines.push(toCsvRow([p.date, p.revenue, p.ordersCount])),
      );
      lines.push('');
    }

    if (overview?.topSellingProducts?.length) {
      lines.push(toCsvRow(['Top Product', 'Units', 'Revenue']));
      overview.topSellingProducts.forEach((p) =>
        lines.push(toCsvRow([p.title, p.totalQuantity, p.totalRevenue])),
      );
      lines.push('');
    }

    if (traffic?.length) {
      lines.push(toCsvRow(['Channel', 'Sessions', 'Users', 'Orders', 'Revenue', 'Conversion %']));
      traffic.forEach((t) =>
        lines.push(
          toCsvRow([t.channel, t.sessions, t.users, t.orders, t.revenue, t.conversionRate]),
        ),
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date(filters.dateFrom).toISOString().slice(0, 10)}-to-${new Date(
      filters.dateTo,
    )
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 pt-6 pb-2 bg-white">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-[13px] font-medium text-slate-500 mt-1">
          Track your store performance and growth
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Date range */}
        <div className="relative" ref={rangeRef}>
          <button
            type="button"
            onClick={() => {
              setRangeOpen((o) => !o);
              setCompareOpen(false);
            }}
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            {filters.rangeLabel}
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {rangeOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-1.5">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    filters.setRange(opt.key);
                    setRangeOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {opt.label}
                  {filters.rangeKey === opt.key && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
              <div className="border-t border-slate-100 mt-1.5 pt-2 px-2 pb-1 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Custom range
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filters.customFrom}
                    max={filters.customTo || undefined}
                    onChange={(e) => filters.setCustomRange(e.target.value, filters.customTo)}
                    className="flex-1 h-8 px-2 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-slate-400 text-xs">–</span>
                  <input
                    type="date"
                    value={filters.customTo}
                    min={filters.customFrom || undefined}
                    onChange={(e) => filters.setCustomRange(filters.customFrom, e.target.value)}
                    className="flex-1 h-8 px-2 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compare */}
        <div className="relative" ref={compareRef}>
          <button
            type="button"
            onClick={() => {
              setCompareOpen((o) => !o);
              setRangeOpen(false);
            }}
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <span className="text-slate-500 font-medium">Compare:</span> {filters.compareLabel}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {compareOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-1.5">
              {COMPARE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    filters.setCompare(opt.key);
                    setCompareOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {opt.label}
                  {filters.compareKey === opt.key && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export
        </button>
      </div>
    </div>
  );
}
