'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  Package,
  Truck,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useGetIncomeQuery,
  useGetAccountsQuery,
} from '../api/financeApi';
import { CreateIncomeModal } from './CreateIncomeModal';

export function FinanceIncomeView() {
  const [categoryCode, setCategoryCode] = useState('');
  const [accountId, setAccountId] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetIncomeQuery({
    categoryCode: categoryCode || undefined,
    accountId: accountId || undefined,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 20,
  });

  const { data: accountsData } = useGetAccountsQuery();
  const accounts = accountsData?.items || [];
  const incomeList = data?.items || [];
  const summary = data?.summary;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Income & Revenue</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track product sales, shipping income, and other revenue streams
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Record Income
          </button>
        </div>
      </div>

      {/* Summary Stream Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Income</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ৳{Number(summary?.totalIncome || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Sales</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ৳{Number(summary?.totalProductSales || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Shipping Income</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ৳{Number(summary?.totalShippingIncome || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Other Income</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ৳{Number(summary?.totalOtherIncome || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search income note..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
          />
        </div>

        <div>
          <select
            value={categoryCode}
            onChange={(e) => {
              setCategoryCode(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
          >
            <option value="">All Categories</option>
            <option value="PRODUCT_SALES">Product Sales</option>
            <option value="SHIPPING_INCOME">Shipping Income</option>
            <option value="OTHER_INCOME">Other Income</option>
          </select>
        </div>

        <div>
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading income streams...
          </div>
        ) : incomeList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No income records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Txn #</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Account</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      {t.transactionDate}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono font-bold text-slate-900">
                      {t.transactionNumber}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-emerald-700">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                        {t.category?.name || t.categoryCode?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                      {t.description || t.reference || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-700 font-medium">
                      {t.account?.name || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {t.paymentMethod || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono font-bold text-right text-emerald-600">
                      +৳{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({data?.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateIncomeModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
