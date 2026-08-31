'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Landmark,
  CheckCircle,
  Building2,
} from 'lucide-react';
import {
  useGetTransfersQuery,
  useGetAccountsQuery,
} from '../api/financeApi';
import { CreateTransferModal } from './CreateTransferModal';

export function FinanceTransfersView() {
  const { data, isLoading, isFetching, refetch } = useGetTransfersQuery();
  const { data: accountsData } = useGetAccountsQuery();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const transfers = data?.items || [];
  const totalTransferred = data?.totalTransferred || 0;
  const accounts = accountsData?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Transfers</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Internal fund transfers between bank accounts, cash registers, and wallets
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
            Transfer Funds
          </button>
        </div>
      </div>

      {/* Info Banner & Total Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Volume Transferred
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ৳{Number(totalTransferred).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-blue-50/70 border border-blue-200 p-5 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            <span className="font-bold">Accounting Rule:</span> Internal transfers move balances
            between your configured accounts and do <span className="underline">not</span> alter
            overall business revenue or operating profit. Only transfer transaction fees (if
            applicable) are recorded as operational expenses.
          </p>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading transfer records...
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transfers recorded yet. Use &quot;Transfer Funds&quot; to execute internal fund moves.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Transfer #</th>
                  <th className="px-6 py-3.5">From Account</th>
                  <th className="px-6 py-3.5">To Account</th>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5 text-right">Fee</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      {t.transferDate}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono font-bold text-slate-900">
                      {t.transferNumber}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-rose-700">
                      {t.fromAccount?.name || 'Unknown Account'}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-emerald-700">
                      {t.toAccount?.name || 'Unknown Account'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                      {t.reference || t.notes || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono text-right text-slate-500">
                      {Number(t.fee) > 0 ? `৳${Number(t.fee).toLocaleString()}` : '৳0.00'}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono font-bold text-right text-blue-600">
                      ৳{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateTransferModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
