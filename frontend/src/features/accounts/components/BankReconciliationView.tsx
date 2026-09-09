'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Plus, AlertCircle, Landmark } from 'lucide-react';
import { useGetTransactionsQuery, useGetAccountsQuery } from '@/features/finance/api/financeApi';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BankReconciliationView() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [period, setPeriod] = useState('this_month');
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  const { data: accountsData } = useGetAccountsQuery(undefined);
  const { data: txData, isLoading } = useGetTransactionsQuery({ period, accountId: selectedAccount || undefined } as any);

  const accounts = ((accountsData as any)?.accounts ?? (accountsData as any)?.data ?? []).filter(
    (a: any) => ['BANK', 'DIGITAL_WALLET', 'PAYMENT_GATEWAY'].includes(a.type),
  );
  const transactions = (txData as any)?.transactions ?? (txData as any)?.data ?? [];

  const systemBalance = accounts.find((a: any) => a.id === selectedAccount)?.balance ?? 0;
  const bankBalanceNum = Number(bankBalance || 0);
  const difference = bankBalanceNum - Number(systemBalance);

  const matched = transactions.filter((tx: any) => matchedIds.includes(tx.id));
  const unmatched = transactions.filter((tx: any) => !matchedIds.includes(tx.id));

  const toggleMatch = (id: string) => {
    setMatchedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Bank Reconciliation</h1>
        <p className="text-sm text-slate-500 mt-0.5">Match bank statement transactions with system records</p>
      </div>

      {/* Config Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Reconciliation Setup</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bank Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select account...</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bank Statement Balance</label>
            <input
              type="number"
              value={bankBalance}
              onChange={(e) => setBankBalance(e.target.value)}
              placeholder="Enter bank statement balance"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      {selectedAccount && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 mb-2">Bank Statement Balance</p>
            <p className="text-2xl font-extrabold text-blue-600">{formatMoney(bankBalanceNum)}</p>
            <p className="text-[11px] text-slate-400 mt-1">As per bank statement</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 mb-2">System Balance</p>
            <p className="text-2xl font-extrabold text-slate-900">{formatMoney(systemBalance)}</p>
            <p className="text-[11px] text-slate-400 mt-1">As per books</p>
          </div>
          <div className={`bg-white border rounded-2xl p-5 shadow-xs ${Math.abs(difference) < 0.01 ? 'border-emerald-100' : 'border-rose-100'}`}>
            <p className="text-xs font-semibold text-slate-500 mb-2">Difference</p>
            <p className={`text-2xl font-extrabold ${Math.abs(difference) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(Math.abs(difference))}
            </p>
            {Math.abs(difference) < 0.01 ? (
              <p className="text-[11px] text-emerald-500 mt-1 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Balanced
              </p>
            ) : (
              <p className="text-[11px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Unbalanced
              </p>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      {selectedAccount && transactions.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Reconciliation Progress</h3>
            <span className="text-xs text-slate-500 font-semibold">
              {matched.length} / {transactions.length} matched
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${transactions.length > 0 ? (matched.length / transactions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {selectedAccount && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-800">Transactions</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                {unmatched.length} unmatched
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                {matched.length} matched
              </span>
            </div>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No transactions found</p>
              <p className="text-xs text-slate-400 mt-1">Try changing the period or account selection</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider w-12">Match</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Debit</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Credit</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((tx: any) => {
                    const isMatched = matchedIds.includes(tx.id);
                    const isExpense = tx.type === 'EXPENSE' || tx.type === 'PAYMENT';
                    return (
                      <tr key={tx.id} className={`hover:bg-slate-50/50 ${isMatched ? 'bg-emerald-50/30' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleMatch(tx.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                              isMatched
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 hover:border-blue-400'
                            }`}
                          >
                            {isMatched && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 max-w-[200px] truncate">{tx.description ?? tx.notes ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-rose-600 font-semibold">{isExpense ? formatMoney(tx.amount) : '—'}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{!isExpense ? formatMoney(tx.amount) : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${isMatched ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {isMatched ? 'Matched' : 'Unmatched'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedAccount && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-xs">
          <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <p className="text-base font-bold text-slate-700">Select a bank account to begin</p>
          <p className="text-sm text-slate-400 mt-2">Choose a bank account and period above to start reconciliation</p>
        </div>
      )}
    </div>
  );
}
