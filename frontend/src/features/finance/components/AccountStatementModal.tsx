'use client';

import React from 'react';
import { Landmark, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useGetAccountStatementQuery } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string | null;
}

export function AccountStatementModal({ isOpen, onClose, accountId }: Props) {
  const { data, isLoading } = useGetAccountStatementQuery(accountId || '', {
    skip: !accountId,
  });

  if (!isOpen || !accountId) return null;

  const account = data?.account;
  const summary = data?.summary;
  const transactions = data?.transactions || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? `${account.name} Statement` : 'Account Statement'}
      subtitle={account?.bankOrProviderName || account?.type}
      icon={<Landmark className="w-5 h-5" />}
      size="xl"
    >
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-40 bg-slate-100 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Account Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-semibold text-slate-500 uppercase">Starting Balance</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  ৳{Number(summary?.startingBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-xs font-semibold text-emerald-700 uppercase">Total Inflows</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">
                  +৳{Number(summary?.totalInflow || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-xs font-semibold text-rose-700 uppercase">Total Outflows</p>
                <p className="text-lg font-bold text-rose-700 mt-1">
                  -৳{Number(summary?.totalOutflow || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 uppercase">Current Balance</p>
                <p className="text-lg font-bold text-blue-700 mt-1">
                  ৳{Number(summary?.currentBalance || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Transactions Ledger */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Transaction History ({transactions.length})
              </h4>
              {transactions.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
                  No transactions recorded for this account yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                      {transactions.map((t: any) => {
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
                            <td className="px-4 py-3 text-slate-900 font-mono text-xs font-semibold">
                              {t.transactionNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-700 text-xs max-w-xs truncate">
                              {t.description || t.reference || t.categoryCode || '—'}
                            </td>
                            <td className="px-4 py-3">
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
                              className={`px-4 py-3 text-right text-xs font-bold ${
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
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
