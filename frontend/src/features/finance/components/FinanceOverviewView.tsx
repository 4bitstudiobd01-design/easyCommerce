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

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceOverviewView() {
  const { data, isLoading, refetch, isFetching } = useGetFinanceOverviewQuery();

  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);

  const summary = data?.summary;
  const accounts = data?.accounts || [];
  const recentTransactions = data?.recentTransactions || [];
  const chartData = data?.revenueVsExpenseTrend || [];

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance Overview</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor revenue, operational expenses, cash balances, receivables and payables
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

      {/* 6 Key Performance Indicator (KPI) Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {isLoading ? '...' : formatMoney(summary?.totalRevenue || 0)}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 inline-block">
            Income & Sales
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {isLoading ? '...' : formatMoney(summary?.totalExpenses || 0)}
          </p>
          <span className="text-[11px] font-semibold text-rose-600 mt-1 inline-block">
            COGS & Operations
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Profit</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-xl font-black mt-2 ${
              Number(summary?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-rose-600'
            }`}
          >
            {isLoading ? '...' : formatMoney(summary?.netProfit || 0)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 inline-block">
            Revenue - Expenses
          </span>
        </div>

        {/* Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {isLoading ? '...' : formatMoney(summary?.totalReceivables || 0)}
          </p>
          <span className="text-[11px] font-semibold text-amber-600 mt-1 inline-block">
            Pending Customer Invoices
          </span>
        </div>

        {/* Payables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payables</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {isLoading ? '...' : formatMoney(summary?.totalPayables || 0)}
          </p>
          <span className="text-[11px] font-semibold text-purple-600 mt-1 inline-block">
            Unpaid Vendor Bills
          </span>
        </div>

        {/* Cash & Bank Balances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-teal-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Cash/Bank</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {isLoading ? '...' : formatMoney(summary?.totalAccountBalance || 0)}
          </p>
          <span className="text-[11px] font-semibold text-teal-600 mt-1 inline-block">
            Across {accounts.length} Active Accounts
          </span>
        </div>
      </div>

      {/* Main Charts & Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expense Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue vs Expense Trend</h3>
              <p className="text-xs text-slate-500">Monthly financial performance over the last 6 months</p>
            </div>
            <Link
              href="/dashboard/finance/reports"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Full Reports →
            </Link>
          </div>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No transaction data available for trend analysis.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    formatter={(val: any) => [`৳${Number(val || 0).toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Account Balances Quick Card (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Financial Accounts</h3>
                <p className="text-xs text-slate-500">Live balances per account</p>
              </div>
              <Link
                href="/dashboard/finance/accounts"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Manage →
              </Link>
            </div>

            {accounts.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">No accounts configured yet.</p>
                <Link
                  href="/dashboard/finance/accounts"
                  className="inline-block mt-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  + Add First Account
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        {acc.type === 'BANK' && <Building2 className="w-4 h-4" />}
                        {acc.type === 'CASH' && <Wallet className="w-4 h-4" />}
                        {acc.type === 'PAYMENT_GATEWAY' && <CreditCard className="w-4 h-4" />}
                        {acc.type === 'DIGITAL_WALLET' && <Landmark className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {acc.bankOrProviderName || acc.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900 font-mono">
                        ৳{Number(acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      {acc.isDefault && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Total Liquid Balance:</span>
            <span className="font-bold text-slate-900 font-mono text-sm">
              {formatMoney(summary?.totalAccountBalance || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest 10 transactions recorded in the system</p>
          </div>
          <Link
            href="/dashboard/finance/transactions"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All Transactions →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transactions found. Record your first income or expense to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Txn #</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Account</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((t) => {
                  const isCredit = t.type === 'INCOME' || t.type === 'PAYMENT';
                  const isTransfer = t.type === 'TRANSFER';
                  const amt = Number(t.amount || 0);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {t.transactionDate}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono font-bold text-slate-900">
                        {t.transactionNumber}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isCredit
                              ? 'bg-emerald-100 text-emerald-800'
                              : isTransfer
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCredit && <ArrowDownLeft className="w-3 h-3" />}
                          {!isCredit && !isTransfer && <ArrowUpRight className="w-3 h-3" />}
                          {isTransfer && <ArrowLeftRight className="w-3 h-3" />}
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                          {t.category?.name || t.categoryCode || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                        {t.description || t.reference || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-700 font-medium">
                        {t.account?.name || '—'}
                      </td>
                      <td
                        className={`px-6 py-3.5 text-xs font-mono font-bold text-right ${
                          isCredit
                            ? 'text-emerald-600'
                            : isTransfer
                            ? 'text-slate-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {isCredit ? '+' : isTransfer ? '' : '-'}৳{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateIncomeModal isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} />
      <CreateExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />
      <CreateTransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <CreateInvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} />
      <CreateBillModal isOpen={isBillOpen} onClose={() => setIsBillOpen(false)} />
    </div>
  );
}
