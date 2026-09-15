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
  ChevronsLeft,
  ChevronsRight,
  Download,
  Wallet,
} from 'lucide-react';
import {
  useGetTransactionsQuery,
  useDeleteTransactionMutation,
  useExportFinanceTransactionsMutation,
  useGetAccountsQuery,
  useGetCategoriesQuery,
  FinanceCategory,
  FinanceAccount,
  FinanceTransaction,
} from '../api/financeApi';
import { CreateTransactionModal } from './CreateTransactionModal';
<<<<<<< HEAD
import { IncomeDetailModal } from './IncomeDetailModal';
import { ExpenseDetailModal } from './ExpenseDetailModal';

function formatMoney(amount: number | string | undefined): string {
  const num = Number(amount || 0);
  return '৳' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
=======
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
>>>>>>> 28beebd18d9f9b378e71bc134817fba440e55106

export function FinanceTransactionsTable() {
  const [type, setType] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<FinanceTransaction | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<FinanceTransaction | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetTransactionsQuery({
    type: type || undefined,
    accountId: accountId || undefined,
    categoryCode: categoryCode || undefined,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  });

  const { data: accountsData } = useGetAccountsQuery();
  const { data: categories } = useGetCategoriesQuery();
<<<<<<< HEAD
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [exportTransactions, { isLoading: isExporting }] = useExportFinanceTransactionsMutation();
=======
  const [deleteTransaction, { isLoading: isDeletingTransaction }] = useDeleteTransactionMutation();
  const [transactionIdPendingDelete, setTransactionIdPendingDelete] = useState<string | null>(null);
>>>>>>> 28beebd18d9f9b378e71bc134817fba440e55106

  const accounts: FinanceAccount[] = Array.isArray(accountsData)
    ? accountsData
    : (accountsData as any)?.items || [];
  const categoryList: FinanceCategory[] = Array.isArray(categories) ? categories : [];
  const transactions = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.total || 0;
  const recentMonthSummary = data?.recentMonthSummary;
  const startEntry = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleDelete = (id: string) => {
    setTransactionIdPendingDelete(id);
  };

  const confirmDelete = async () => {
    if (!transactionIdPendingDelete) return;
    try {
      await deleteTransaction(transactionIdPendingDelete).unwrap();
      toast.success('Transaction deleted.');
      setTransactionIdPendingDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete transaction.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transactions</h1>
            {recentMonthSummary?.monthLabel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                {recentMonthSummary.monthLabel}: {formatMoney(recentMonthSummary.totalVolume)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Full journal of income, expenses, refunds, transfers, and adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={async () => {
              try {
                const res = await exportTransactions({
                  type: type || undefined,
                  categoryCode: categoryCode || undefined,
                }).unwrap();
                if (res?.csv) {
                  const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', res.filename || 'finance_transactions.csv');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              } catch (err: any) {
                toast.error(err?.data?.message || 'Failed to export CSV.');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition disabled:opacity-50"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
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

      {/* Recent Month Summary Stream Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Transaction Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {recentMonthSummary?.monthLabel || 'Recent Month'}
              </span>
              <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">
                Total Volume
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-0.5 font-mono truncate">
              {formatMoney(recentMonthSummary?.totalVolume || 0)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {recentMonthSummary?.transactionCount || 0} transactions recorded
            </p>
          </div>
        </div>

        {/* Total Inflow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Inflow
            </span>
            <p className="text-xl font-black text-emerald-600 mt-0.5 font-mono truncate">
              +{formatMoney(recentMonthSummary?.totalIncome || 0)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              Revenue & collections
            </p>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Outflow
            </span>
            <p className="text-xl font-black text-rose-600 mt-0.5 font-mono truncate">
              -{formatMoney(recentMonthSummary?.totalExpense || 0)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              Purchases & bills disbursed
            </p>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              (recentMonthSummary?.netCashFlow || 0) >= 0
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            <Wallet className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Net Cash Flow
            </span>
            <p
              className={`text-xl font-black mt-0.5 font-mono truncate ${
                (recentMonthSummary?.netCashFlow || 0) >= 0 ? 'text-indigo-600' : 'text-amber-600'
              }`}
            >
              {(recentMonthSummary?.netCashFlow || 0) >= 0 ? '+' : ''}
              {formatMoney(recentMonthSummary?.netCashFlow || 0)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              Net balance movement
            </p>
          </div>
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
            {categoryList.map((cat) => (
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
                  const isClickable = !isTransfer;
                  const amt = Number(t.amount || 0);

                  const handleRowClick = () => {
                    if (t.type === 'INCOME' || t.type === 'PAYMENT') {
                      setSelectedIncome(t);
                    } else if (t.type === 'EXPENSE') {
                      setSelectedExpense(t);
                    }
                  };

                  return (
                    <tr
                      key={t.id}
                      onClick={isClickable ? handleRowClick : undefined}
                      className={`transition ${
                        isClickable ? 'cursor-pointer hover:bg-slate-50/80 group' : 'hover:bg-slate-50'
                      }`}
                      title={isClickable ? 'Click row to view details' : undefined}
                    >
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {t.transactionDate}
                      </td>
                      <td className={`px-5 py-3.5 text-xs font-mono font-bold text-slate-900 ${isClickable ? 'group-hover:text-blue-600 transition-colors' : ''}`}>
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
                      <td
                        className="px-5 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.sourceType === 'MANUAL' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(t.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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

        {/* Pagination Toolbar */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
              <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> transactions
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-[11px] text-slate-400">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {totalCount > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 mx-1">
                {getPaginationNumbers().map((num, idx) => {
                  if (num === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(num);
                  const isCurrent = pageNum === page;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <IncomeDetailModal
        isOpen={Boolean(selectedIncome)}
        onClose={() => setSelectedIncome(null)}
        income={selectedIncome}
        onDelete={(inc) => {
          setSelectedIncome(null);
          handleDelete(inc.id);
        }}
      />

      <ExpenseDetailModal
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onDelete={(exp) => {
          setSelectedExpense(null);
          handleDelete(exp.id);
        }}
      />

      <CreateTransactionModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <ConfirmDialog
        isOpen={transactionIdPendingDelete !== null}
        onClose={() => setTransactionIdPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        confirmLabel="Delete"
        isLoading={isDeletingTransaction}
      />
    </div>
  );
}
