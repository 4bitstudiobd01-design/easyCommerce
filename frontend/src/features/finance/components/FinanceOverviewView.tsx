'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Landmark,
  FileText,
  Receipt,
  ArrowLeftRight,
  Plus,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Wallet,
  Building2,
  BookOpen,
  DollarSign,
  Package,
  Users,
  Megaphone,
  Layers,
  ArrowRight,
  Calendar,
  Download,
  Truck,
  Building,
  Zap,
  Cpu,
  Box,
  Wrench,
  ShieldCheck,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  useGetFinanceOverviewQuery,
  useExportFinanceTransactionsMutation,
  FinanceTransaction,
  FinanceAccount,
} from '../api/financeApi';
import { CreateIncomeModal } from './CreateIncomeModal';
import { CreateExpenseModal } from './CreateExpenseModal';
import { CreateTransferModal } from './CreateTransferModal';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { CreateBillModal } from './CreateBillModal';
import { CreateJournalEntryModal } from './CreateJournalEntryModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderGrowthBadge(rate: number, isGoodWhenPositive: boolean = true) {
  if (rate === 0) return null;
  const isPositive = rate > 0;
  const isGood = isGoodWhenPositive ? isPositive : !isPositive;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
        isGood ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
      }`}
    >
      {isPositive ? '+' : ''}
      {rate.toFixed(1)}%
    </span>
  );
}

export function FinanceOverviewView() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const { data, isLoading, refetch, isFetching } = useGetFinanceOverviewQuery({
    year: selectedYear,
    month: selectedMonth === 0 ? undefined : selectedMonth,
  });

  const [exportTransactions, { isLoading: isExporting }] = useExportFinanceTransactionsMutation();

  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  const summary = data?.summary;
  const growth = data?.growth;
  const categoryBreakdown = data?.categoryBreakdown || [];
  const accounts: FinanceAccount[] = Array.isArray(data?.accounts) ? data.accounts : [];
  const recentTransactions: FinanceTransaction[] = Array.isArray(data?.recentTransactions)
    ? data.recentTransactions
    : [];
  const chartData = Array.isArray(data?.revenueVsExpenseTrend) ? data.revenueVsExpenseTrend : [];

  const monthLabel = selectedMonth > 0 ? MONTH_NAMES[selectedMonth - 1] : 'All Year';

  const handleExportCsv = async () => {
    try {
      const res = await exportTransactions({
        year: selectedYear,
        month: selectedMonth === 0 ? undefined : selectedMonth,
      }).unwrap();

      if (res?.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename || `finance_transactions_${selectedYear}_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to export CSV.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance Overview</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>{monthLabel} {selectedYear}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time monthly revenue, operating expenses, cash positions, and accounting reconciliation.
          </p>
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value={0}>All Year ({selectedYear})</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m} {idx + 1 === currentMonth && selectedYear === currentYear ? '⭐ (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Year Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          {/* Export to CSV / Google Sheets */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Download Google Sheets/Excel compatible CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-2xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Quick Create Buttons */}
          <button
            type="button"
            onClick={() => setIsIncomeOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTransferOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer Fund</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="flex items-center gap-1.5">
              {growth && renderGrowthBadge(growth.revenueGrowth, true)}
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatMoney(summary?.totalRevenue || 0)}</p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Online Orders & Delivery</span>
            <Link href="/dashboard/finance/income" className="font-bold text-emerald-600 hover:underline">
              View Income →
            </Link>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Expenses</span>
            <div className="flex items-center gap-1.5">
              {growth && renderGrowthBadge(growth.expenseGrowth, false)}
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatMoney(summary?.totalExpenses || 0)}</p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>COGS, Payroll & Overheads</span>
            <Link href="/dashboard/finance/expenses" className="font-bold text-rose-600 hover:underline">
              View Expenses →
            </Link>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Gross Profit</span>
            <div className="flex items-center gap-1.5">
              {growth && renderGrowthBadge(growth.grossProfitGrowth, true)}
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                {summary?.grossMarginPercent || 0}% Margin
              </span>
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-2">{formatMoney(summary?.grossProfit || 0)}</p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Revenue minus COGS</span>
            <Link href="/dashboard/finance/reports" className="font-bold text-indigo-600 hover:underline">
              P&L Report →
            </Link>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Net Profit</span>
            <div className="flex items-center gap-1.5">
              {growth && renderGrowthBadge(growth.netProfitGrowth, true)}
              <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                {summary?.netMarginPercent || 0}% Net
              </span>
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${(summary?.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatMoney(summary?.netProfit || 0)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Bottom Line Net Profit</span>
            <span className="text-[11px] font-semibold text-slate-400">For {monthLabel}</span>
          </div>
        </div>
      </div>

      {/* Operating Expense Breakdown & Cost Centers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* COGS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>COGS</span>
            <Package className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-base font-black text-slate-900 mt-1">{formatMoney(summary?.cogs || 0)}</p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Product Procurement</span>
        </div>

        {/* Payroll */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Payroll</span>
            <Users className="w-3.5 h-3.5 text-pink-500" />
          </div>
          <p className="text-base font-black text-slate-900 mt-1">{formatMoney(summary?.payrollCost || 0)}</p>
          <Link href="/dashboard/finance/salaries" className="text-[10px] font-bold text-pink-600 hover:underline block mt-0.5">
            Staff Salaries →
          </Link>
        </div>

        {/* Shipping & Courier */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Courier</span>
            <Truck className="w-3.5 h-3.5 text-lime-600" />
          </div>
          <p className="text-base font-black text-slate-900 mt-1">{formatMoney(summary?.shippingCost || 0)}</p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Steadfast & Pathao</span>
        </div>

        {/* Marketing */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Marketing</span>
            <Megaphone className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-base font-black text-slate-900 mt-1">{formatMoney(summary?.marketingCost || 0)}</p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Meta & Google Ads</span>
        </div>

        {/* Rent & Facilities */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Rent</span>
            <Building className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <p className="text-base font-black text-slate-900 mt-1">{formatMoney(summary?.rentCost || 0)}</p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Shop & Warehouse</span>
        </div>

        {/* Utilities & Internet */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Utilities</span>
            <Zap className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <p className="text-base font-black text-slate-900 mt-1">{formatMoney(summary?.utilitiesCost || 0)}</p>
          <span className="text-[10px] text-slate-500 block mt-0.5">DESCO, WASA & Net</span>
        </div>
      </div>

      {/* Second Row of Balance Sheet Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Inventory Value</span>
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">{formatMoney(summary?.inventoryCost || 0)}</p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Stock Asset Valuation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Receivables</span>
            <FileText className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-lg font-black text-blue-600 mt-1">{formatMoney(summary?.totalReceivables || 0)}</p>
          <Link href="/dashboard/finance/invoices" className="text-[10px] font-bold text-blue-600 hover:underline block mt-0.5">
            Unpaid Invoices →
          </Link>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Payables</span>
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-lg font-black text-amber-600 mt-1">{formatMoney(summary?.totalPayables || 0)}</p>
          <Link href="/dashboard/finance/bills" className="text-[10px] font-bold text-amber-600 hover:underline block mt-0.5">
            Vendor Bills & Salaries →
          </Link>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
            <span>Cash & Bank</span>
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-emerald-700 mt-1">{formatMoney(summary?.totalAccountBalance || 0)}</p>
          <Link href="/dashboard/finance/accounts" className="text-[10px] font-bold text-emerald-600 hover:underline block mt-0.5">
            {accounts.length} Active Accounts →
          </Link>
        </div>
      </div>

      {/* Main Analysis Row: 6-Month Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue vs Expense Trend</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Monthly financial performance, operating expenses, and net margins across 6 months
              </p>
            </div>
            <Link href="/dashboard/finance/reports" className="text-xs font-bold text-blue-600 hover:underline">
              Full Reports →
            </Link>
          </div>

          <div className="h-[280px] w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '16px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                No transaction data available for trend analysis.
              </div>
            )}
          </div>
        </div>

        {/* Expense Category Breakdown Widget */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Expense Breakdown</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">By cost category for {monthLabel}</p>
            </div>
            <PieChartIcon className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.slice(0, 6).map((cat) => (
                <div key={cat.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">৳{cat.amount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                No expense breakdown recorded for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Financial Accounts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Accounts Widget */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Financial Accounts</h2>
            <Link href="/dashboard/finance/accounts" className="text-xs font-bold text-blue-600 hover:underline">
              Manage →
            </Link>
          </div>

          <div className="space-y-3">
            {accounts.length > 0 ? (
              accounts.map((acc) => {
                const isCash = acc.type === 'CASH';
                const isBank = acc.type === 'BANK';
                const isWallet = acc.type === 'DIGITAL_WALLET';

                return (
                  <div
                    key={acc.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isCash
                            ? 'bg-emerald-100 text-emerald-800'
                            : isBank
                            ? 'bg-blue-100 text-blue-800'
                            : isWallet
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {isCash ? '💵' : isBank ? '🏦' : isWallet ? '📱' : '💳'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight">{acc.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {acc.accountNumber ? `A/C: ${acc.accountNumber}` : acc.bankOrProviderName || acc.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">{formatMoney(acc.currentBalance)}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Active</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No accounts configured yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent 10 Transactions Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Audit trail across Orders, Purchases, Salaries & Expenses
              </p>
            </div>
            <Link href="/dashboard/finance/transactions" className="text-xs font-bold text-blue-600 hover:underline">
              View All Transactions →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Recorded By</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((t) => {
                    const isIncome = t.type === 'INCOME';
                    const creatorName =
                      t.createdByUser?.fullName || t.createdByUser?.email || 'System Auto';
                    const creatorId =
                      t.createdByUser?.id || t.createdByUserId || 'SYS';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-medium text-slate-500 text-[11px] whitespace-nowrap">
                          {t.transactionDate}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[200px]">{t.description}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.transactionNumber}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {t.sourceType || 'MANUAL'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-slate-700 font-medium">
                            {t.category?.name || t.categoryCode || 'General'}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-600 shrink-0">
                              {creatorName[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate text-[11px] max-w-[100px]" title={creatorName}>
                                {creatorName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono block">
                                ID: {creatorId.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`font-black text-xs ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isIncome ? '+' : '-'}৳{Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-medium">
                      No recent transactions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {isIncomeOpen && <CreateIncomeModal isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} />}
      {isExpenseOpen && <CreateExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />}
      {isTransferOpen && <CreateTransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />}
      {isInvoiceOpen && <CreateInvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} />}
      {isBillOpen && <CreateBillModal isOpen={isBillOpen} onClose={() => setIsBillOpen(false)} />}
      {isJournalOpen && <CreateJournalEntryModal isOpen={isJournalOpen} onClose={() => setIsJournalOpen(false)} />}
    </div>
  );
}
