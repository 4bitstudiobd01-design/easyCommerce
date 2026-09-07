'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
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
  Landmark,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  useGetIncomeQuery,
  useGetAccountsQuery,
  useDeleteIncomeMutation,
  FinanceAccount,
  FinanceTransaction,
} from '../api/financeApi';
import { CreateIncomeModal } from './CreateIncomeModal';
import { EditIncomeModal } from './EditIncomeModal';

function formatMoney(amount: number | string, prefix = '৳') {
  const val = Number(amount || 0);
  return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceIncomeView() {
  const [categoryCode, setCategoryCode] = useState('');
  const [accountId, setAccountId] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<FinanceTransaction | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetIncomeQuery({
    categoryCode: categoryCode || undefined,
    accountId: accountId || undefined,
    search: search ? search.trim() : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 20,
  });

  const [deleteIncome, { isLoading: isDeleting }] = useDeleteIncomeMutation();

  const { data: accountsData } = useGetAccountsQuery();
  const rawAccounts = (accountsData as any)?.data !== undefined ? (accountsData as any).data : accountsData;
  const accounts: FinanceAccount[] = Array.isArray(rawAccounts)
    ? rawAccounts
    : (rawAccounts as any)?.items || [];
  const incomeList: FinanceTransaction[] = data?.items || [];
  const summary = data?.summary;
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (id: string, txnNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete income transaction ${txnNumber}? Any associated account balance addition will be reverted.`)) {
      return;
    }
    try {
      await deleteIncome(id).unwrap();
      toast.success(`Income transaction ${txnNumber} deleted and balance reverted.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete income transaction.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Income & Revenue</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {data?.total || incomeList.length} Total Records
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track product sales, courier COD remittances, shipping charges, and secondary revenue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Income
          </button>
        </div>
      </div>

      {/* Summary Stream Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Income</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {formatMoney(summary?.totalIncome || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Product Sales</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {formatMoney(summary?.totalProductSales || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shipping Revenue</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {formatMoney(summary?.totalShippingIncome || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Other Inflows</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {formatMoney(summary?.totalOtherIncome || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search income note, txn #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={categoryCode}
            onChange={(e) => {
              setCategoryCode(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="PRODUCT_SALES">Product Sales (COD & Digital)</option>
            <option value="SHIPPING_INCOME">Shipping & Delivery Fees</option>
            <option value="SERVICE_INCOME">Service Income</option>
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
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
          >
            <option value="">All Receiving Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency} {Number(acc.currentBalance).toLocaleString()})
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
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs animate-pulse flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <p className="font-semibold">Loading income streams...</p>
          </div>
        ) : incomeList.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No income records found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                No matching transactions recorded for the selected filter criteria.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Txn #</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Receiving Account</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5 text-right">Amount (BDT)</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                      {String(t.transactionDate || '').split('T')[0]}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {t.transactionNumber}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t.category?.name || t.categoryCode?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        {t.sourceType === 'INVOICE' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            INVOICE
                          </span>
                        ) : t.sourceType === 'ORDER' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                            ORDER
                          </span>
                        ) : null}
                        <span className="font-medium text-slate-900 block truncate" title={t.description || ''}>
                          {t.description || t.reference || '—'}
                        </span>
                      </div>
                      {t.reference && t.reference !== t.description && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Ref: {t.reference}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {t.account ? (
                        <div className="flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800">{t.account.name}</span>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
                            {t.account.type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Direct Cash / Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                      {t.paymentMethod || 'CASH'}
                    </td>
                    <td className="px-6 py-3.5 font-black text-right text-emerald-600 whitespace-nowrap">
                      {formatMoney(t.amount, '+৳')}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingIncome(t)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit Income"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(t.id, t.transactionNumber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Income"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Income Modal */}
      <CreateIncomeModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Edit Income Modal */}
      {editingIncome && (
        <EditIncomeModal
          isOpen={Boolean(editingIncome)}
          onClose={() => setEditingIncome(null)}
          income={editingIncome}
        />
      )}
    </div>
  );
}
