'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Wallet,
  TrendingUp,
  ArrowUp,
  ChevronRight,
  User,
  Briefcase,
  MoreVertical,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  useGetAccountingOverviewQuery,
  type AccountingOverviewRecentTransaction,
} from '../api/accountingApi';

// ─── Formatting helpers ──────────────────────────────────────────────────────

/** Numeric string → "৳" + thousands-separated whole number (mock shows whole taka). */
const formatTaka = (value: string | number): string => {
  const n = Math.round(Number(value ?? 0));
  return `৳${n.toLocaleString('en-US')}`;
};

/** "YYYY-MM-DD" → "Mon DD, YYYY". Falls back to the raw string if unparseable. */
const formatLongDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

/** "YYYY-MM-DD" → "Mon DD" for compact chart / range labels. */
const formatShortDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

const formatRange = (from: string, to: string): string =>
  `${formatLongDate(from)} - ${formatLongDate(to)}`;

const formatShortRange = (from: string, to: string): string =>
  `${formatShortDate(from)} - ${formatShortDate(to)}`;

/** Signed percent string ("18.60" / "-4.20") → rounded integer with one decimal trimmed. */
const formatPct = (pct: string): string => {
  const n = Number(pct ?? 0);
  return `${Math.abs(n).toFixed(1)}%`;
};

const isNegative = (pct: string): boolean => Number(pct ?? 0) < 0;

// ─── Small building blocks ───────────────────────────────────────────────────

function ChangeBadge({ pct, invertColors = false }: { pct: string; invertColors?: boolean }) {
  const negative = isNegative(pct);
  // For revenue / net profit a rise is good (emerald); for expenses a rise is bad (rose).
  const good = invertColors ? negative : !negative;
  const colorClass = good ? 'text-emerald-600' : 'text-rose-500';
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold ${colorClass}`}>
      <ArrowUp className={`w-3 h-3 ${negative ? 'rotate-180' : ''}`} />
      <span>{formatPct(pct)}</span>
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  changePct,
  invertColors = false,
  comparisonLabel,
  staticSubLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  changePct?: string;
  invertColors?: boolean;
  comparisonLabel?: string;
  staticSubLabel?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3.5">
        {icon}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-slate-500 block">{label}</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</div>
          {changePct !== undefined ? (
            <div className="flex items-center gap-1 mt-1.5">
              <ChangeBadge pct={changePct} invertColors={invertColors} />
              <span className="text-slate-400 font-normal text-[11px] ml-0.5">
                vs {comparisonLabel}
              </span>
            </div>
          ) : (
            <div className="text-[11px] font-medium text-slate-500 mt-1.5">{staticSubLabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-start gap-3.5 animate-pulse">
        <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-6 w-28 bg-slate-100 rounded" />
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function AccountingOverviewView() {
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useGetAccountingOverviewQuery(
    range.from && range.to ? { from: range.from, to: range.to } : undefined,
  );

  // Seed the local picker inputs from the response period once it arrives.
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  useEffect(() => {
    if (data?.period && !range.from) {
      setDraftFrom(data.period.from);
      setDraftTo(data.period.to);
    }
  }, [data?.period, range.from]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const period = data?.period;
  const dateRangeLabel = period
    ? formatRange(period.from, period.to)
    : range.from && range.to
    ? formatRange(range.from, range.to)
    : 'This Month';

  const prevPeriodLabel = data?.comparison.previousPeriod
    ? formatShortRange(
        data.comparison.previousPeriod.from,
        data.comparison.previousPeriod.to,
      )
    : '';

  const timeFilterLabel = period ? formatShortRange(period.from, period.to) : 'This Month';

  const chartData = useMemo(
    () =>
      (data?.trend ?? []).map((p) => ({
        name: formatShortDate(p.date),
        revenue: Number(p.revenue),
        expenses: Number(p.expenses),
      })),
    [data?.trend],
  );

  const chartMax = useMemo(() => {
    const peak = chartData.reduce(
      (m, p) => Math.max(m, p.revenue, p.expenses),
      0,
    );
    return peak > 0 ? peak : 1;
  }, [chartData]);

  const yTicks = useMemo(() => {
    const step = Math.ceil(chartMax / 4 / 1000) * 1000 || 1000;
    return [0, step, step * 2, step * 3, step * 4];
  }, [chartMax]);

  const applyRange = () => {
    if (draftFrom && draftTo && draftFrom <= draftTo) {
      setRange({ from: draftFrom, to: draftTo });
      setPickerOpen(false);
    }
  };

  const transactions: AccountingOverviewRecentTransaction[] = data?.recentTransactions ?? [];

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your business.</p>
        </div>

        {/* Date Range Picker Dropdown */}
        <div className="flex items-center relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <span>{dateRangeLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {pickerOpen && (
            <div className="absolute right-0 top-full mt-2 z-20 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">From</label>
                <input
                  type="date"
                  value={draftFrom}
                  max={draftTo || undefined}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">To</label>
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom || undefined}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={applyRange}
                disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !data ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Card 1: Total Revenue */}
            <KpiCard
              icon={
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
              }
              label="Total Revenue"
              value={formatTaka(data.kpis.totalRevenue)}
              changePct={data.comparison.revenueChangePct}
              comparisonLabel={prevPeriodLabel}
            />

            {/* Card 2: Total Expenses */}
            <KpiCard
              icon={
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <div className="w-5 h-5 rounded border-2 border-rose-500 flex items-center justify-center">
                    <ArrowUp className="w-3 h-3 rotate-180 text-rose-500 stroke-[2.5]" />
                  </div>
                </div>
              }
              label="Total Expenses"
              value={formatTaka(data.kpis.totalExpenses)}
              changePct={data.comparison.expensesChangePct}
              invertColors
              comparisonLabel={prevPeriodLabel}
            />

            {/* Card 3: Net Profit */}
            <KpiCard
              icon={
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 stroke-[2.2]" />
                </div>
              }
              label="Net Profit"
              value={formatTaka(data.kpis.netProfit)}
              changePct={data.comparison.netProfitChangePct}
              comparisonLabel={prevPeriodLabel}
            />

            {/* Card 4: Cash Balance */}
            <KpiCard
              icon={
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
              }
              label="Cash Balance"
              value={formatTaka(data.kpis.cashBalance)}
              staticSubLabel="In Hand / In Bank"
            />
          </>
        )}
      </div>

      {/* Middle Section (Revenue vs Expenses Chart + Outstanding Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Revenue vs Expenses Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-base font-bold text-slate-900">Revenue vs Expenses</h2>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="font-semibold text-slate-700">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-semibold text-slate-700">Expenses</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition self-start sm:self-auto"
            >
              <span>{timeFilterLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            {isLoading || isFetching ? (
              <div className="h-full w-full rounded-xl bg-slate-50 animate-pulse" />
            ) : chartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-xs font-medium text-slate-400">
                No posted activity in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: '#f1f5f9' }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    ticks={yTicks}
                    tickFormatter={(val) => `৳${val === 0 ? '0' : val / 1000 + 'k'}`}
                  />

                  <Tooltip
                    formatter={(val: any) => [val !== undefined ? `৳${Number(val).toLocaleString()}` : '', '']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ fontWeight: 'bold', color: '#94a3b8' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    dot={{ r: 3.5, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: '#3b82f6' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGradient)"
                    dot={{ r: 3.5, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: '#f43f5e' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Outstanding Summary (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-base font-bold text-slate-900">Outstanding Summary</h2>
              <Link
                href="/dashboard/accounting/reports/balance-sheet"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View Details
              </Link>
            </div>

            <div className="space-y-3.5 mt-2">
              {/* Accounts Receivable */}
              <Link
                href="/dashboard/accounting/accounts/ledger"
                className="group flex items-center justify-between p-4 bg-blue-50/50 hover:bg-blue-50/80 rounded-2xl border border-blue-100/60 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">Accounts Receivable</span>
                    <div className="text-lg font-extrabold text-slate-900 tracking-tight">
                      {data ? formatTaka(data.outstanding.accountsReceivable.amount) : '৳0'}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      From {data?.outstanding.accountsReceivable.accountCount ?? 0} accounts
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>

              {/* Accounts Payable */}
              <Link
                href="/dashboard/accounting/transactions/expenses"
                className="group flex items-center justify-between p-4 bg-amber-50/50 hover:bg-amber-50/80 rounded-2xl border border-amber-100/60 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">Accounts Payable</span>
                    <div className="text-lg font-extrabold text-slate-900 tracking-tight">
                      {data ? formatTaka(data.outstanding.accountsPayable.amount) : '৳0'}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      To {data?.outstanding.accountsPayable.accountCount ?? 0} accounts
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-50">
          <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
          <Link
            href="/dashboard/accounting/transactions/journal-entries"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 font-bold">Date</th>
                <th className="px-6 py-3.5 font-bold">Description</th>
                <th className="px-6 py-3.5 font-bold">Account</th>
                <th className="px-6 py-3.5 font-bold">Type</th>
                <th className="px-6 py-3.5 font-bold">Amount</th>
                <th className="px-6 py-3.5 font-bold">Status</th>
                <th className="px-6 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4" colSpan={7}>
                      <div className="h-4 w-full bg-slate-100 rounded" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-slate-400 font-medium" colSpan={7}>
                    No posted transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">
                      {formatLongDate(item.date)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{item.account}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                          item.type === 'Income'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-500'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                      <span
                        className={
                          item.type === 'Income' ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'
                        }
                      >
                        {formatTaka(item.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        title="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="py-3.5 text-center text-xs text-slate-400 border-t border-slate-50">
          All amounts are in BDT
        </div>
      </div>
    </div>
  );
}
