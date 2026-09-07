'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Layers,
  Scale,
} from 'lucide-react';
import {
  useGetChartOfAccountsQuery,
  FinanceAccountClass,
  FinanceChartOfAccount,
} from '../api/financeApi';
import { CreateChartOfAccountModal } from './CreateChartOfAccountModal';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CLASS_BADGES: Record<FinanceAccountClass, { label: string; bg: string; text: string; border: string }> = {
  ASSET: { label: 'Asset (1000s)', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  LIABILITY: { label: 'Liability (2000s)', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  EQUITY: { label: 'Equity (3000s)', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  REVENUE: { label: 'Revenue (4000s)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  EXPENSE: { label: 'Expense (5000/6000s)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export function ChartOfAccountsView() {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetChartOfAccountsQuery({
    accountClass: selectedClass !== 'ALL' ? selectedClass : undefined,
    search: searchQuery.trim() || undefined,
  });

  const accounts = data?.accounts || [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Chart of Accounts</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Standardized hierarchical ledger accounts for double-entry bookkeeping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Summary Metrics Banner */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-blue-600 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assets</span>
              <Building2 className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">{formatMoney(summary.totalAssets)}</p>
            <span className="text-[10px] font-semibold text-blue-600">1000s Accounts</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Liabilities</span>
              <Scale className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">{formatMoney(summary.totalLiabilities)}</p>
            <span className="text-[10px] font-semibold text-amber-600">2000s Accounts</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-purple-600 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Equity</span>
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">{formatMoney(summary.totalEquity)}</p>
            <span className="text-[10px] font-semibold text-purple-600">3000s Accounts</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Revenue</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">{formatMoney(summary.totalRevenue)}</p>
            <span className="text-[10px] font-semibold text-emerald-600">4000s Accounts</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Expenses</span>
              <TrendingDown className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">{formatMoney(summary.totalExpenses)}</p>
            <span className="text-[10px] font-semibold text-rose-600">5000/6000s Accounts</span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { key: 'ALL', label: 'All Accounts' },
            { key: 'ASSET', label: 'Assets (1000)' },
            { key: 'LIABILITY', label: 'Liabilities (2000)' },
            { key: 'EQUITY', label: 'Equity (3000)' },
            { key: 'REVENUE', label: 'Revenue (4000)' },
            { key: 'EXPENSE', label: 'Expenses (5000-6000)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedClass(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedClass === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or account..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-hidden transition"
          />
        </div>
      </div>

      {/* Chart of Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-6">Code</th>
                <th className="py-3.5 px-6">Account Name & Description</th>
                <th className="py-3.5 px-6">Classification</th>
                <th className="py-3.5 px-6">Normal</th>
                <th className="py-3.5 px-6 text-right">Current Balance</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading chart of accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const badge = CLASS_BADGES[acc.accountClass] || {
                    label: acc.accountClass,
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-4 px-6">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {acc.code}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{acc.name}</span>
                            {acc.isSystem && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                                title="Core System Account"
                              >
                                <Lock className="w-3 h-3" /> System
                              </span>
                            )}
                          </div>
                          {acc.description && (
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5 max-w-md line-clamp-1">
                              {acc.description}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`text-[11px] font-bold ${
                            acc.normalBalance === 'DEBIT' ? 'text-blue-600' : 'text-purple-600'
                          }`}
                        >
                          {acc.normalBalance === 'DEBIT' ? 'Debit (Dr)' : 'Credit (Cr)'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                        {formatMoney(acc.currentBalance)}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <Link
                          href={`/dashboard/finance/ledger?accountId=${acc.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                          <span>Ledger</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateChartOfAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
