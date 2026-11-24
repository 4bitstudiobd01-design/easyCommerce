'use client';

import React, { useState, useMemo } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Plus, AlertCircle, Landmark } from 'lucide-react';
import { useGetTransactionsQuery, useGetAccountsQuery } from '@/features/finance/api/financeApi';
import { CreateAccountModal } from '@/features/finance/components/CreateAccountModal';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BankReconciliationView() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [period, setPeriod] = useState('all_time');
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'UNMATCHED' | 'MATCHED'>('ALL');

  const { data: accountsData, isLoading: isLoadingAccounts } = useGetAccountsQuery(undefined);

  const accounts = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(accountsData)) {
      list = accountsData;
    } else if (Array.isArray((accountsData as any)?.items)) {
      list = (accountsData as any).items;
    } else if (Array.isArray((accountsData as any)?.data?.items)) {
      list = (accountsData as any).data.items;
    } else if (Array.isArray((accountsData as any)?.data)) {
      list = (accountsData as any).data;
    } else if (Array.isArray((accountsData as any)?.accounts)) {
      list = (accountsData as any).accounts;
    }
    return list.filter((a: any) => a.isActive !== false);
  }, [accountsData]);

  // Auto-select default or first account when accounts load
  React.useEffect(() => {
    if (!selectedAccount && accounts.length > 0) {
      const defaultAcc = accounts.find((a: any) => a.isDefault) || accounts[0];
      if (defaultAcc?.id) {
        setSelectedAccount(defaultAcc.id);
      }
    }
  }, [accounts, selectedAccount]);

  const dateRange = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: ymd(start), endDate: ymd(end) };
    }
    if (period === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: ymd(start), endDate: ymd(end) };
    }
    if (period === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qMonth, 1);
      const end = new Date(now.getFullYear(), qMonth + 3, 0);
      return { startDate: ymd(start), endDate: ymd(end) };
    }
    // all_time: no date restrictions
    return { startDate: undefined, endDate: undefined };
  }, [period]);

  const queryAccountId = selectedAccount === 'ALL' ? undefined : (selectedAccount || undefined);

  const { data: txData, isLoading, refetch: refetchTx } = useGetTransactionsQuery(
    selectedAccount
      ? ({
          accountId: queryAccountId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 200,
        } as any)
      : ({} as any),
    { skip: !selectedAccount },
  );

  const transactions = useMemo(() => {
    if (!selectedAccount) return [];
    if (Array.isArray(txData)) return txData;
    if (Array.isArray((txData as any)?.items)) return (txData as any).items;
    if (Array.isArray((txData as any)?.transactions)) return (txData as any).transactions;
    if (Array.isArray((txData as any)?.data?.items)) return (txData as any).data.items;
    if (Array.isArray((txData as any)?.data)) return (txData as any).data;
    return [];
  }, [txData, selectedAccount]);

  const selectedAcc = accounts.find((a: any) => a.id === selectedAccount);
  const systemBalance = selectedAccount === 'ALL'
    ? accounts.reduce((sum: number, a: any) => sum + Number(a.currentBalance || 0), 0)
    : Number(selectedAcc?.currentBalance ?? selectedAcc?.balance ?? 0);
  const bankBalanceNum = Number(bankBalance || 0);
  const difference = bankBalanceNum - systemBalance;

  const matched = transactions.filter((tx: any) => matchedIds.includes(tx.id));
  const unmatched = transactions.filter((tx: any) => !matchedIds.includes(tx.id));

  const displayedTransactions = useMemo(() => {
    if (filterType === 'MATCHED') return matched;
    if (filterType === 'UNMATCHED') return unmatched;
    return transactions;
  }, [filterType, transactions, matched, unmatched]);

  const toggleMatch = (id: string) => {
    setMatchedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleMatchAll = () => {
    if (matchedIds.length === transactions.length) {
      setMatchedIds([]);
    } else {
      setMatchedIds(transactions.map((t: any) => t.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bank Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Match bank statement transactions with system records</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateAccountOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Account
        </button>
      </div>

      {/* Config Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Reconciliation Setup</h3>
          <button
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> New Account
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bank Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Accounts (সব একাউন্টের লেনদেন)</option>
              {accounts.map((a: any) => {
                const typeLabel = a.type ? a.type.replace(/_/g, ' ') : '';
                const details = [
                  typeLabel,
                  a.accountNumber ? `#${a.accountNumber}` : null,
                  a.bankOrProviderName,
                ].filter(Boolean).join(' • ');

                return (
                  <option key={a.id} value={a.id}>
                    {a.name} {details ? `(${details})` : ''} - ৳{Number(a.currentBalance || 0).toLocaleString()}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all_time">All Time (সব লেনদেন)</option>
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
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {systemBalance > 0 && (
              <button
                type="button"
                onClick={() => setBankBalance(String(systemBalance))}
                className="text-[10px] font-bold text-blue-600 hover:underline mt-1 block"
              >
                Use System Balance ({formatMoney(systemBalance)})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      {selectedAccount && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 mb-2">Bank Statement Balance</p>
            <p className="text-2xl font-extrabold text-blue-600 font-mono">{formatMoney(bankBalanceNum)}</p>
            <p className="text-[11px] text-slate-400 mt-1">As per bank statement</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 mb-2">System Balance</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{formatMoney(systemBalance)}</p>
            <p className="text-[11px] text-slate-400 mt-1">As per books</p>
          </div>
          <div className={`bg-white border rounded-2xl p-5 shadow-xs ${Math.abs(difference) < 0.01 ? 'border-emerald-100' : 'border-rose-100'}`}>
            <p className="text-xs font-semibold text-slate-500 mb-2">Difference</p>
            <p className={`text-2xl font-extrabold font-mono ${Math.abs(difference) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
            <span className="text-xs text-slate-500 font-semibold font-mono">
              {matched.length} / {transactions.length} matched (
              {transactions.length > 0 ? Math.round((matched.length / transactions.length) * 100) : 0}%)
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
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800 mr-2">Transactions</h3>

              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  filterType === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({transactions.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('UNMATCHED')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  filterType === 'UNMATCHED'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Unmatched ({unmatched.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('MATCHED')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  filterType === 'MATCHED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Matched ({matched.length})
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {transactions.length > 0 && (
                <button
                  type="button"
                  onClick={handleMatchAll}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
                >
                  {matchedIds.length === transactions.length && transactions.length > 0
                    ? 'Unmatch All'
                    : 'Match All'}
                </button>
              )}
              <button
                type="button"
                onClick={() => refetchTx()}
                title="Refresh transactions"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-7 h-7 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-3">Loading transactions...</p>
            </div>
          ) : displayedTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No transactions found</p>
              <p className="text-xs text-slate-400 mt-1">
                {period !== 'all_time'
                  ? 'There are no transactions recorded in this period.'
                  : 'No transactions found for this account.'}
              </p>
              {period !== 'all_time' && (
                <button
                  type="button"
                  onClick={() => setPeriod('all_time')}
                  className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition inline-flex items-center gap-1.5"
                >
                  Show All Time (সব লেনদেন দেখুন)
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="text-center px-4 py-3 w-12">Match</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Txn #</th>
                    <th className="text-left px-4 py-3">Description</th>
                    <th className="text-right px-4 py-3">Debit (- Out)</th>
                    <th className="text-right px-4 py-3">Credit (+ In)</th>
                    <th className="text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedTransactions.map((tx: any) => {
                    const isMatched = matchedIds.includes(tx.id);
                    const isExpense =
                      tx.type === 'EXPENSE' ||
                      tx.type === 'PAYMENT' ||
                      (tx.type === 'TRANSFER' && tx.accountId === selectedAccount);

                    return (
                      <tr key={tx.id} className={`hover:bg-slate-50/70 transition ${isMatched ? 'bg-emerald-50/40' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleMatch(tx.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                              isMatched
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 hover:border-blue-400'
                            }`}
                          >
                            {isMatched && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {tx.transactionDate || '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                          {tx.transactionNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 max-w-[240px] truncate">
                          {tx.description ?? tx.reference ?? tx.notes ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-600 font-bold font-mono whitespace-nowrap">
                          {isExpense ? `-${formatMoney(tx.amount)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-bold font-mono whitespace-nowrap">
                          {!isExpense ? `+${formatMoney(tx.amount)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isMatched
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
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
          <button
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>
      )}

      {/* Add Financial Account Modal */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
      />
    </div>
  );
}
