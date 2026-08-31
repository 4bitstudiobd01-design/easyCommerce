'use client';

import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  RefreshCw,
  Building2,
  Wallet,
  CreditCard,
  History,
  CheckCircle,
} from 'lucide-react';
import {
  useGetAccountsQuery,
  FinanceAccount,
} from '../api/financeApi';
import { CreateAccountModal } from './CreateAccountModal';
import { AccountStatementModal } from './AccountStatementModal';

export function FinanceAccountsView() {
  const { data, isLoading, isFetching, refetch } = useGetAccountsQuery();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statementAccountId, setStatementAccountId] = useState<string | null>(null);

  const accounts: FinanceAccount[] = Array.isArray(data) ? data : (data as any)?.items || [];
  const totalBalance = Array.isArray(data)
    ? data.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0)
    : (data as any)?.totalBalance || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Accounts</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your bank accounts, cash registers, digital wallets, and payment gateways
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
            Add Account
          </button>
        </div>
      </div>

      {/* Total Liquid Holdings Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs uppercase font-bold text-blue-100 tracking-wider">
            Total Combined Account Balance
          </p>
          <p className="text-3xl font-black mt-1">
            ৳{Number(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blue-200 mt-1">
            Aggregated across {accounts.length} active financial accounts
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
          <Landmark className="w-8 h-8" />
        </div>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="h-44 bg-slate-100 rounded-2xl" />
          <div className="h-44 bg-slate-100 rounded-2xl" />
          <div className="h-44 bg-slate-100 rounded-2xl" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Accounts Created Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Set up your cash registers, bank accounts, or digital wallets to start tracking balances.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            Add First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    {acc.type === 'BANK' && <Building2 className="w-5 h-5" />}
                    {acc.type === 'CASH' && <Wallet className="w-5 h-5" />}
                    {acc.type === 'PAYMENT_GATEWAY' && <CreditCard className="w-5 h-5" />}
                    {acc.type === 'DIGITAL_WALLET' && <Landmark className="w-5 h-5" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {acc.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <CheckCircle className="w-3 h-3" />
                        Default
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                      {acc.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{acc.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {acc.bankOrProviderName || 'Internal'}
                    {acc.accountNumber ? ` • ${acc.accountNumber}` : ''}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Current Balance
                  </p>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    ৳{Number(acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Starting: ৳{Number(acc.startingBalance).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => setStatementAccountId(acc.id)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                >
                  <History className="w-3.5 h-3.5" />
                  Statement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAccountModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <AccountStatementModal
        isOpen={!!statementAccountId}
        onClose={() => setStatementAccountId(null)}
        accountId={statementAccountId}
      />
    </div>
  );
}
