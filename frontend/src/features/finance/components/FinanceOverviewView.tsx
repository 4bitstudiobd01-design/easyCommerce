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
  FinanceTransaction,
  FinanceAccount,
} from '../api/financeApi';
import { CreateIncomeModal } from './CreateIncomeModal';
import { CreateExpenseModal } from './CreateExpenseModal';
import { CreateTransferModal } from './CreateTransferModal';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { CreateBillModal } from './CreateBillModal';
import { CreateJournalEntryModal } from './CreateJournalEntryModal';

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
  const { data, isLoading, refetch, isFetching } = useGetFinanceOverviewQuery();

  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  const summary = data?.summary;
  const growth = data?.growth;
  const accounts: FinanceAccount[] = Array.isArray(data?.accounts) ? data.accounts : [];
  const recentTransactions: FinanceTransaction[] = Array.isArray(data?.recentTransactions)
    ? data.recentTransactions
    : [];
  const chartData = Array.isArray(data?.revenueVsExpenseTrend) ? data.revenueVsExpenseTrend : [];

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance Overview</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time financial performance, profitability, cash positions, and double-entry health
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsJournalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            New Journal Entry
          </button>
          <button
            type="button"
            onClick={() => setIsIncomeOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Income
          </button>
          <button
            type="button"
            onClick={() => setIsExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Expense
          </button>
          <button
            type="button"
            onClick={() => setIsTransferOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Transfer
          </button>
          <button
            type="button"
            onClick={() => setIsInvoiceOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Invoice
          </button>
          <button
            type="button"
            onClick={() => setIsBillOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Receipt className="w-3.5 h-3.5" />
            Bill
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
            <span>Online Orders & Invoices</span>
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
            <span>COGS & Operating Expenses</span>
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
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-teal-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Net Profit</span>
            <div className="flex items-center gap-1.5">
              {growth && renderGrowthBadge(growth.netProfitGrowth, true)}
              <span className="text-[10px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                {summary?.netMarginPercent || 0}% Net
              </span>
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${(summary?.netProfit || 0) >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
            {formatMoney(summary?.netProfit || 0)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Bottom Line Net Profit</span>
            <span className="text-[11px] font-bold text-slate-400">This Month</span>
          </div>
        </div>
      </div>

      {/* Secondary Operational & Balance Sheet KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* COGS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">COGS</span>
            <Package className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-base font-black text-slate-900">{formatMoney(summary?.cogs || 0)}</p>
          <span className="text-[10px] text-slate-400 font-medium">Product & Fulfillment</span>
        </div>

        {/* Inventory Stock Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Inventory Value</span>
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <p className="text-base font-black text-slate-900">{formatMoney(summary?.inventoryCost || 0)}</p>
          <Link href="/dashboard/inventory" className="text-[10px] text-cyan-600 font-bold hover:underline">
            Stock Assets →
          </Link>
        </div>

        {/* Payroll */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Payroll</span>
            <Users className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-base font-black text-slate-900">{formatMoney(summary?.payrollCost || 0)}</p>
          <span className="text-[10px] text-slate-400 font-medium">Staff Salaries</span>
        </div>

        {/* Marketing */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Marketing</span>
            <Megaphone className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-base font-black text-slate-900">{formatMoney(summary?.marketingCost || 0)}</p>
          <span className="text-[10px] text-slate-400 font-medium">Ads & Campaigns</span>
        </div>

        {/* Receivables (AR) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Receivables</span>
            <FileText className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-base font-black text-slate-900">{formatMoney(summary?.totalReceivables || 0)}</p>
          <Link href="/dashboard/finance/invoices" className="text-[10px] text-blue-600 font-bold hover:underline">
            Unpaid Invoices →
          </Link>
        </div>

        {/* Payables (AP) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Payables</span>
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-base font-black text-slate-900">{formatMoney(summary?.totalPayables || 0)}</p>
          <Link href="/dashboard/finance/bills" className="text-[10px] text-amber-600 font-bold hover:underline">
            Vendor Bills →
          </Link>
        </div>

        {/* Total Cash/Bank */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Cash & Bank</span>
            <Landmark className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <p className="text-base font-black text-slate-900">{formatMoney(summary?.totalAccountBalance || 0)}</p>
          <Link href="/dashboard/finance/accounts" className="text-[10px] text-teal-600 font-bold hover:underline">
            {accounts.length} Active Accounts →
          </Link>
        </div>
      </div>

      {/* Main Charts & Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Revenue vs Expense Trend</h2>
              <p className="text-xs text-slate-500 font-medium">Monthly financial performance over the last 6 months</p>
            </div>
            <Link
              href="/dashboard/finance/reports"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Full Reports →
            </Link>
          </div>

          <div className="h-72 w-full pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                    formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" name="Net Profit" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No transaction data available for trend analysis.
              </div>
            )}
          </div>
        </div>

        {/* Financial Accounts Widget */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Financial Accounts</h2>
              <p className="text-xs text-slate-500 font-medium">Live balances per account</p>
            </div>
            <Link
              href="/dashboard/finance/accounts"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
            {accounts.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No accounts configured yet.
                <button
                  type="button"
                  onClick={() => setIsIncomeOpen(true)}
                  className="block mx-auto mt-2 text-blue-600 font-bold hover:underline"
                >
                  + Add First Account
                </button>
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                      {acc.type === 'BANK' && <Building2 className="w-4 h-4 text-blue-600" />}
                      {acc.type === 'CASH' && <Wallet className="w-4 h-4 text-emerald-600" />}
                      {acc.type === 'PAYMENT_GATEWAY' && <CreditCard className="w-4 h-4 text-purple-600" />}
                      {acc.type === 'DIGITAL_WALLET' && <DollarSign className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                        {acc.isDefault && (
                          <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-md">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {acc.bankOrProviderName || acc.type}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-slate-900">
                      {formatMoney(acc.currentBalance)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateIncomeModal isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} />
      <CreateExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />
      <CreateTransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <CreateInvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} />
      <CreateBillModal isOpen={isBillOpen} onClose={() => setIsBillOpen(false)} />
      <CreateJournalEntryModal isOpen={isJournalOpen} onClose={() => setIsJournalOpen(false)} />
    </div>
  );
}
