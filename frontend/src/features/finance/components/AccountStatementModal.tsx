'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useGetAccountStatementQuery } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string | null;
}

export function AccountStatementModal({ isOpen, onClose, accountId }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useGetAccountStatementQuery(accountId || '', {
    skip: !accountId,
  });

  // Reset page when account changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setPage(1);
    }
  }, [isOpen, accountId]);

  if (!isOpen || !accountId) return null;

  const account = data?.account;
  const summary = data?.summary;
  const transactions = data?.transactions || [];

  const totalCount = transactions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalCount);

  const paginatedTransactions = transactions.slice((page - 1) * pageSize, page * pageSize);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? `${account.name} Statement` : 'Account Statement'}
      subtitle={account?.bankOrProviderName || account?.type}
      icon={<Landmark className="w-5 h-5" />}
      size="5xl"
    >
      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-40 bg-slate-100 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Account Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">বর্তমান ব্যালেন্স (Current)</p>
                <p className="text-xl font-black text-blue-900 font-mono mt-1">
                  ৳{Number(summary?.currentBalance || 0).toLocaleString()}
                </p>
                <span className="text-[10px] text-blue-600 font-medium block mt-0.5">Live Available Balance</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">গত মাসে ছিল (Last Month)</p>
                <p className="text-xl font-black text-slate-700 font-mono mt-1">
                  ৳{Number(summary?.lastMonthBalance !== undefined ? summary.lastMonthBalance : summary?.startingBalance || 0).toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Closing Balance</span>
              </div>

              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">এই মাসে Credit (+ In)</p>
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xl font-black text-emerald-700 font-mono mt-1">
                  +৳{Number(summary?.thisMonthCredit !== undefined ? summary.thisMonthCredit : summary?.totalInflow || 0).toLocaleString()}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">This Month Inflows</span>
              </div>

              <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">এই মাসে Debit (- Out)</p>
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <p className="text-xl font-black text-rose-700 font-mono mt-1">
                  -৳{Number(summary?.thisMonthDebit !== undefined ? summary.thisMonthDebit : summary?.totalOutflow || 0).toLocaleString()}
                </p>
                <span className="text-[10px] text-rose-600 font-medium block mt-0.5">This Month Deductions</span>
              </div>
            </div>

            {/* Transactions Ledger */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Transaction History ({totalCount})
                </h4>
                {totalCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span>Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                )}
              </div>

              {totalCount === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
                  No transactions recorded for this account yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Txn #</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedTransactions.map((t: any) => {
                          const isCredit =
                            t.type === 'INCOME' ||
                            t.type === 'PAYMENT' ||
                            (t.type === 'TRANSFER' && t.toAccountId === accountId);
                          const amt = Number(t.amount || 0);

                          return (
                            <tr key={t.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 text-slate-600 text-xs font-medium whitespace-nowrap">
                                {t.transactionDate}
                              </td>
                              <td className="px-4 py-3 text-slate-900 font-mono text-xs font-semibold whitespace-nowrap">
                                {t.transactionNumber}
                              </td>
                              <td className="px-4 py-3 text-slate-700 text-xs max-w-xs truncate">
                                {t.description || t.reference || t.categoryCode || '—'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    isCredit
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {isCredit ? (
                                    <ArrowDownLeft className="w-3 h-3" />
                                  ) : (
                                    <ArrowUpRight className="w-3 h-3" />
                                  )}
                                  {t.type}
                                </span>
                              </td>
                              <td
                                className={`px-4 py-3 text-right text-xs font-bold font-mono whitespace-nowrap ${
                                  isCredit ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {isCredit ? '+' : '-'}৳{amt.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="font-medium text-slate-600">
                      Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
                      <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
                      <span className="font-bold text-slate-900">{totalCount}</span> transactions
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                        className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                        title="First Page"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1 mx-1">
                        {getPaginationNumbers().map((num, idx) => {
                          if (num === '...') {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold">
                                ...
                              </span>
                            );
                          }
                          const pageNum = Number(num);
                          const isCurrent = pageNum === page;
                          return (
                            <button
                              key={`stmt-page-${pageNum}`}
                              type="button"
                              onClick={() => setPage(pageNum)}
                              className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                        className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                        title="Next Page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage(totalPages)}
                        className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                        title="Last Page"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
