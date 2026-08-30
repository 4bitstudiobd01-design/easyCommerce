'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useGetTransactionsQuery,
  useDeleteTransactionMutation,
  useGetAccountsQuery,
  useGetCategoriesQuery,
} from '../api/financeApi';
import { CreateTransactionModal } from './CreateTransactionModal';

export function FinanceTransactionsTable() {
  const [type, setType] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetTransactionsQuery({
    type: type || undefined,
    accountId: accountId || undefined,
    categoryCode: categoryCode || undefined,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 20,
  });

  const { data: accountsData } = useGetAccountsQuery();
  const { data: categories } = useGetCategoriesQuery();
  const [deleteTransaction] = useDeleteTransactionMutation();

  const accounts = accountsData?.items || [];
  const transactions = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(id).unwrap();
      toast.success('Transaction deleted.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete transaction.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Full journal of income, expenses, refunds, transfers, and adjustments
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search txn # or note..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="PAYMENT">Payment</option>
            <option value="REFUND">Refund</option>
            <option value="TRANSFER">Transfer</option>
            <option value="ADJUSTMENT">Adjustment</option>
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
          <select
            value={categoryCode}
            onChange={(e) => {
              setCategoryCode(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.code}>
                {cat.name}
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
            placeholder="Start date"
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
            placeholder="End date"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transactions found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Txn #</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Account</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => {
                  const isCredit = t.type === 'INCOME' || t.type === 'PAYMENT';
                  const isTransfer = t.type === 'TRANSFER';
                  const amt = Number(t.amount || 0);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {t.transactionDate}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-900">
                        {t.transactionNumber}
                      </td>
                      <td className="px-5 py-3.5">
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
                      <td className="px-5 py-3.5 text-xs text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                          {t.category?.name || t.categoryCode || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                        {t.description || t.reference || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                        {t.type === 'TRANSFER' && t.account && t.toAccount
                          ? `${t.account.name} → ${t.toAccount.name}`
                          : t.account?.name || '—'}
                      </td>
                      <td
                        className={`px-5 py-3.5 text-xs font-mono font-bold text-right ${
                          isCredit
                            ? 'text-emerald-600'
                            : isTransfer
                            ? 'text-slate-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {isCredit ? '+' : isTransfer ? '' : '-'}৳{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {t.sourceType === 'MANUAL' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({data?.total} total records)
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

      <CreateTransactionModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
