'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  BarChart3,
  Scale,
  Download,
  Calendar as CalendarIcon,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetBalanceSheetReportQuery,
  type BalanceSheetReport,
  type ReportLine,
} from '../api/accountingApi';

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

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

const EMPTY_REPORT: BalanceSheetReport = {
  asOf: '',
  assets: { total: '0.00', lines: [] },
  liabilities: { total: '0.00', lines: [] },
  equity: { total: '0.00', lines: [], retainedEarningsToDate: '0.00' },
  liabilitiesAndEquity: '0.00',
  isBalanced: true,
  difference: '0.00',
};

export function BalanceSheetView() {
  const [asOfDate, setAsOfDate] = useState(today());

  const { data, isLoading, isFetching } = useGetBalanceSheetReportQuery({ asOf: asOfDate });
  const report = data ?? EMPTY_REPORT;
  const showLoading = isLoading || isFetching;

  const asOfLabel = report.asOf ? formatDate(report.asOf) : formatDate(asOfDate);

  const handleExport = () => {
    toast.success('Preparing print view…');
    window.print();
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Balance Sheet</h1>
          <p className="text-sm text-slate-500 mt-1">
            View your business financial position at a specific date.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* As-of date picker */}
          <div className="relative">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={asOfDate}
              max={today()}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
            />
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

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<CreditCard className="w-5 h-5" />}
          iconClass="bg-blue-50 text-blue-600"
          label="Total Assets"
          value={formatCurrency(report.assets.total)}
          asOf={asOfLabel}
          loading={showLoading}
        />
        <KpiCard
          icon={<Building2 className="w-5 h-5" />}
          iconClass="bg-rose-50 text-rose-500"
          label="Total Liabilities"
          value={formatCurrency(report.liabilities.total)}
          asOf={asOfLabel}
          loading={showLoading}
        />
        <KpiCard
          icon={<BarChart3 className="w-5 h-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
          label="Total Equity"
          value={formatCurrency(report.equity.total)}
          asOf={asOfLabel}
          loading={showLoading}
        />
        <KpiCard
          icon={<Scale className="w-5 h-5" />}
          iconClass="bg-purple-50 text-purple-600"
          label="Total Liabilities & Equity"
          value={formatCurrency(report.liabilitiesAndEquity)}
          asOf={asOfLabel}
          loading={showLoading}
        />
      </div>

      {/* Accounting Equation Banner */}
      <div className="bg-white rounded-2xl p-4 px-6 border border-blue-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Assets = Liabilities + Equity</span>
        </div>

        <div className="text-xs font-mono font-bold text-slate-800">
          {formatCurrency(report.assets.total)} = {formatCurrency(report.liabilities.total)} +{' '}
          {formatCurrency(report.equity.total)}
        </div>

        <div>
          {report.isBalanced ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Balanced
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Out of balance by {formatCurrency(report.difference)}
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Split: Assets vs Liabilities & Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: ASSETS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-6">
          <div>
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">ASSETS</h2>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-3 pb-1 border-b border-slate-100">
              <span>ACCOUNT</span>
              <span>AMOUNT (৳)</span>
            </div>
          </div>

          <div className="space-y-2 text-[12.5px] pl-3 text-slate-700">
            {showLoading ? (
              <SkeletonRows />
            ) : report.assets.lines.length === 0 ? (
              <p className="text-slate-400 italic">No asset balances as of this date.</p>
            ) : (
              report.assets.lines.map((line) => <LineRow key={line.accountId} line={line} />)
            )}
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl flex items-center justify-between font-bold text-blue-600 text-sm">
            <span>TOTAL ASSETS</span>
            <span className="font-mono font-extrabold text-base">
              {formatCurrency(report.assets.total)}
            </span>
          </div>
        </div>

        {/* Right Column: LIABILITIES & EQUITY */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-6">
          <div>
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              LIABILITIES &amp; EQUITY
            </h2>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-3 pb-1 border-b border-slate-100">
              <span>ACCOUNT</span>
              <span>AMOUNT (৳)</span>
            </div>
          </div>

          <div className="space-y-6 text-[12.5px]">
            {/* Liabilities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-blue-600">
                <span>Liabilities</span>
                <span className="font-mono">{formatCurrency(report.liabilities.total)}</span>
              </div>
              <div className="space-y-2 pl-3 text-slate-700">
                {showLoading ? (
                  <SkeletonRows />
                ) : report.liabilities.lines.length === 0 ? (
                  <p className="text-slate-400 italic">No liability balances.</p>
                ) : (
                  report.liabilities.lines.map((line) => (
                    <LineRow key={line.accountId} line={line} />
                  ))
                )}
              </div>
            </div>

            {/* Equity */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <div className="flex items-center justify-between font-bold text-blue-600">
                <span>Equity</span>
                <span className="font-mono">{formatCurrency(report.equity.total)}</span>
              </div>
              <div className="space-y-2 pl-3 text-slate-700">
                {showLoading ? (
                  <SkeletonRows />
                ) : (
                  <>
                    {report.equity.lines.map((line) => (
                      <LineRow key={line.accountId} line={line} />
                    ))}
                    <div className="flex items-center justify-between">
                      <span>Retained Earnings (current period)</span>
                      <span className="font-mono text-slate-900">
                        {formatCurrency(report.equity.retainedEarningsToDate)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl flex items-center justify-between font-bold text-blue-600 text-sm">
            <span>TOTAL LIABILITIES &amp; EQUITY</span>
            <span className="font-mono font-extrabold text-base">
              {formatCurrency(report.liabilitiesAndEquity)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Caption */}
      <div className="py-2 text-center text-xs text-slate-400">
        All amounts are in BDT · As of {asOfLabel}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  iconClass,
  label,
  value,
  asOf,
  loading,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  asOf: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3.5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-slate-500 block">{label}</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight font-mono">
            {loading ? (
              <span className="inline-block h-7 w-28 rounded bg-slate-100 animate-pulse" />
            ) : (
              value
            )}
          </div>
          <div className="text-[11px] font-normal text-slate-400 mt-1">{asOf}</div>
        </div>
      </div>
    </div>
  );
}

function LineRow({ line }: { line: ReportLine }) {
  return (
    <div className="flex items-center justify-between">
      <span>{line.name}</span>
      <span className="font-mono text-slate-900">{formatCurrency(line.amount)}</span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-5 rounded bg-slate-100 animate-pulse" />
      ))}
    </>
  );
}
