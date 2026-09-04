'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Percent,
  Download,
  Calendar as CalendarIcon,
  Info,
  Store as StoreIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetProfitLossReportQuery,
  type ProfitLossReport,
  type ReportLine,
} from '../api/accountingApi';
import { useGetBranchesQuery } from '@/features/tenant/api/tenantApi';

/** "1520.00" | 1520 → "৳1,520.00" */
function formatCurrency(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '৳0.00';
  return `৳${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "2024-05-31" → "May 31, 2024" */
function formatDate(value: string): string {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/** Share of revenue for a value, as "12.34%" (or "-" when revenue is 0). */
function pctOfRevenue(amount: string, revenueTotal: string): string {
  const rev = Number(revenueTotal ?? 0);
  if (!rev) return '-';
  return `${((Number(amount ?? 0) / rev) * 100).toFixed(2)}%`;
}

const EMPTY_REPORT: ProfitLossReport = {
  period: { from: '', to: '' },
  revenue: { total: '0.00', lines: [] },
  cogs: { total: '0.00', lines: [] },
  grossProfit: '0.00',
  operatingExpenses: { total: '0.00', lines: [] },
  netProfit: '0.00',
  netMarginPct: '0.00',
};

export function ProfitLossView() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [branchId, setBranchId] = useState('');

  const { data: branches } = useGetBranchesQuery();

  const params = useMemo(() => {
    const p: { from?: string; to?: string; branchId?: string } = {};
    if (fromDate) p.from = fromDate;
    if (toDate) p.to = toDate;
    if (branchId) p.branchId = branchId;
    return p;
  }, [fromDate, toDate, branchId]);

  const { data, isLoading, isFetching } = useGetProfitLossReportQuery(params);
  const report = data ?? EMPTY_REPORT;
  const showLoading = isLoading || isFetching;

  const periodLabel =
    report.period.from && report.period.to
      ? `${formatDate(report.period.from)} – ${formatDate(report.period.to)}`
      : 'Fiscal year to date';

  const netProfitPositive = Number(report.netProfit) >= 0;

  const handleExport = () => {
    toast.success('Preparing print view…');
    window.print();
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profit &amp; Loss</h1>
          <p className="text-sm text-slate-500 mt-1">
            View your business income and expenses summary.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* From date */}
          <div className="relative">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
          <span className="text-xs text-slate-400">–</span>
          {/* To date */}
          <div className="relative">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Branch filter */}
          <div className="relative">
            <StoreIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-6 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm appearance-none"
            >
              <option value="">All branches</option>
              {(branches ?? []).map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Period label */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
        <span>Period: {periodLabel}</span>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Total Revenue</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight font-mono">
                {showLoading ? (
                  <span className="inline-block h-7 w-28 rounded bg-slate-100 animate-pulse" />
                ) : (
                  formatCurrency(report.revenue.total)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Cost of Goods Sold */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <div className="w-5 h-5 rounded-full border-2 border-rose-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Cost of Goods Sold</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight font-mono">
                {showLoading ? (
                  <span className="inline-block h-7 w-28 rounded bg-slate-100 animate-pulse" />
                ) : (
                  formatCurrency(report.cogs.total)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Net Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Net Profit</span>
              <div
                className={`text-2xl font-extrabold mt-1 tracking-tight font-mono ${
                  netProfitPositive ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {showLoading ? (
                  <span className="inline-block h-7 w-28 rounded bg-slate-100 animate-pulse" />
                ) : (
                  formatCurrency(report.netProfit)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Net Profit Margin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Net Profit Margin</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {showLoading ? (
                    <span className="inline-block h-7 w-20 rounded bg-slate-100 animate-pulse" />
                  ) : (
                    `${report.netMarginPct}%`
                  )}
                </span>
                {!showLoading && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      netProfitPositive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {report.netMarginPct}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit & Loss Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Profit &amp; Loss Statement</h2>
            <Info className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-xs font-medium text-slate-500">{periodLabel}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 font-bold">PARTICULARS</th>
                <th className="px-6 py-3.5 font-bold text-right">AMOUNT (৳)</th>
                <th className="px-6 py-3.5 font-bold text-right">% OF REVENUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-[12.5px]">
              {showLoading ? (
                [...Array(7)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={3} className="px-6 py-3">
                      <div className="h-6 rounded-lg bg-slate-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {/* Operating Revenue */}
                  <tr className="bg-slate-50/70">
                    <td className="px-6 py-3.5 font-bold text-slate-900">Operating Revenue</td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(report.revenue.total)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-blue-600">
                      {Number(report.revenue.total) ? '100.00%' : '-'}
                    </td>
                  </tr>
                  <LineRows lines={report.revenue.lines} revenueTotal={report.revenue.total} />

                  {/* COGS */}
                  <tr>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">Cost of Goods Sold</td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-900">
                      {formatCurrency(report.cogs.total)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-600">
                      {pctOfRevenue(report.cogs.total, report.revenue.total)}
                    </td>
                  </tr>
                  <LineRows lines={report.cogs.lines} revenueTotal={report.revenue.total} />

                  {/* Gross Profit */}
                  <tr className="bg-slate-50/80 font-bold">
                    <td className="px-6 py-3.5 text-slate-900">Gross Profit</td>
                    <td className="px-6 py-3.5 text-right font-mono font-extrabold text-slate-900">
                      {formatCurrency(report.grossProfit)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-900 font-bold">
                      {pctOfRevenue(report.grossProfit, report.revenue.total)}
                    </td>
                  </tr>

                  {/* Operating Expenses */}
                  <tr>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">Operating Expenses</td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-900">
                      {formatCurrency(report.operatingExpenses.total)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-600">
                      {pctOfRevenue(report.operatingExpenses.total, report.revenue.total)}
                    </td>
                  </tr>
                  <LineRows
                    lines={report.operatingExpenses.lines}
                    revenueTotal={report.revenue.total}
                  />

                  {/* Net Profit */}
                  <tr className="font-extrabold">
                    <td
                      className={`px-6 py-4 ${netProfitPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      Net Profit
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-mono ${
                        netProfitPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(report.netProfit)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-bold ${
                        netProfitPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {report.netMarginPct}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-slate-600 font-medium">Net Profit Margin</td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                      {report.netMarginPct}%
                    </td>
                    <td className="px-6 py-3 text-right text-slate-400">-</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="py-3.5 text-center text-xs text-slate-400 border-t border-slate-50">
          All amounts are in BDT
        </div>
      </div>
    </div>
  );
}

function LineRows({
  lines,
  revenueTotal,
}: {
  lines: ReportLine[];
  revenueTotal: string;
}) {
  if (lines.length === 0) {
    return (
      <tr>
        <td className="px-6 py-2.5 pl-12 text-slate-400 italic">No activity in this period</td>
        <td className="px-6 py-2.5 text-right font-mono text-slate-400">
          {formatCurrency('0')}
        </td>
        <td className="px-6 py-2.5 text-right text-slate-400">-</td>
      </tr>
    );
  }

  return (
    <>
      {lines.map((line) => (
        <tr key={line.accountId} className="hover:bg-slate-50/40 transition">
          <td className="px-6 py-2.5 pl-12 text-slate-600">{line.name}</td>
          <td className="px-6 py-2.5 text-right font-mono text-slate-700">
            {formatCurrency(line.amount)}
          </td>
          <td className="px-6 py-2.5 text-right font-medium text-slate-500">
            {pctOfRevenue(line.amount, revenueTotal)}
          </td>
        </tr>
      ))}
    </>
  );
}
