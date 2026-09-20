'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Landmark,
  CreditCard,
  Banknote,
  Smartphone,
  Globe,
  Plus,
  RefreshCw,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CheckCircle2,
  Star,
  Settings2,
  FileText,
  Wallet,
  Receipt,
  Layers,
  ChevronRight,
  Wifi,
} from 'lucide-react';
import {
  useGetAccountsQuery,
  useGetTransactionsQuery,
  useGetTransfersQuery,
  FinanceAccount,
  FinanceAccountType,
  FinanceTransaction,
  FinanceTransfer,
} from '@/features/finance/api/financeApi';
import { CreateAccountModal } from '@/features/finance/components/CreateAccountModal';
import { DepositToAccountModal } from '@/features/finance/components/DepositToAccountModal';
import { CreateExpenseModal } from '@/features/finance/components/CreateExpenseModal';
import { CreateTransferModal } from '@/features/finance/components/CreateTransferModal';
import { AccountStatementModal } from '@/features/finance/components/AccountStatementModal';
import { EditAccountModal } from '@/features/finance/components/EditAccountModal';

function formatMoney(amount: number | string | undefined | null) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatVisibleAccountNumber(accNo?: string) {
  if (!accNo) return '';
  const clean = accNo.replace(/\s+/g, '');
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

function formatCardNumber(accountNumber?: string) {
  if (!accountNumber) return '4532 •••• •••• 8890';
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length >= 8) {
    const first4 = clean.slice(0, 4);
    const last4 = clean.slice(-4);
    return `${first4} •••• •••• ${last4}`;
  }
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

const getCardTheme = (account: FinanceAccount) => {
  const isBkash =
    account.name.toLowerCase().includes('bkash') ||
    account.bankOrProviderName?.toLowerCase().includes('bkash');
  const isNagad =
    account.name.toLowerCase().includes('nagad') ||
    account.bankOrProviderName?.toLowerCase().includes('nagad');
  const isRocket =
    account.name.toLowerCase().includes('rocket') ||
    account.bankOrProviderName?.toLowerCase().includes('rocket');

  if (isBkash) {
    return {
      gradient: 'from-[#831843] via-[#9d174d] to-[#4c0519]',
      glow: 'bg-pink-500/25',
      network: 'bKash Merchant',
      networkType: 'DIGITAL WALLET',
      chipColor: 'from-amber-200 via-amber-400 to-amber-600',
      accentColor: 'text-pink-300',
    };
  }
  if (isNagad) {
    return {
      gradient: 'from-[#7c2d12] via-[#9a3412] to-[#431407]',
      glow: 'bg-orange-500/25',
      network: 'Nagad Wallet',
      networkType: 'DIGITAL WALLET',
      chipColor: 'from-amber-200 via-amber-400 to-amber-600',
      accentColor: 'text-orange-300',
    };
  }
  if (isRocket || account.type === 'DIGITAL_WALLET') {
    return {
      gradient: 'from-[#4c1d95] via-[#5b21b6] to-[#2e1065]',
      glow: 'bg-purple-500/25',
      network: account.bankOrProviderName || 'Digital Wallet',
      networkType: 'MOBILE GATEWAY',
      chipColor: 'from-amber-200 via-amber-400 to-amber-600',
      accentColor: 'text-purple-300',
    };
  }
  if (account.type === 'CASH') {
    return {
      gradient: 'from-[#064e3b] via-[#065f46] to-[#022c22]',
      glow: 'bg-emerald-500/25',
      network: 'Cash Drawer / Vault',
      networkType: 'LIQUID RESERVES',
      chipColor: 'from-amber-200 via-amber-300 to-amber-500',
      accentColor: 'text-emerald-300',
    };
  }
  if (account.type === 'CARD') {
    return {
      gradient: 'from-[#18181b] via-[#27272a] to-[#09090b]',
      glow: 'bg-slate-400/20',
      network: account.bankOrProviderName || 'Business Debit',
      networkType: 'DEBIT CARD',
      chipColor: 'from-slate-200 via-slate-300 to-slate-400',
      accentColor: 'text-slate-300',
    };
  }
  if (account.type === 'PAYMENT_GATEWAY') {
    return {
      gradient: 'from-[#083344] via-[#155e75] to-[#042f2e]',
      glow: 'bg-cyan-500/25',
      network: account.bankOrProviderName || 'Payment Settlement',
      networkType: 'GATEWAY SETTLEMENT',
      chipColor: 'from-amber-200 via-amber-400 to-amber-600',
      accentColor: 'text-cyan-300',
    };
  }
  // Default Bank: Luxury Midnight Sapphire
  return {
    gradient: 'from-[#0f172a] via-[#1e293b] to-[#0a192f]',
    glow: 'bg-blue-500/30',
    network: account.bankOrProviderName || 'Commercial Bank',
    networkType: 'BUSINESS ACCOUNT',
    chipColor: 'from-amber-200 via-amber-400 to-amber-600',
    accentColor: 'text-blue-300',
  };
};

export function BankAccountsView() {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'TRANSACTIONS' | 'TRANSFERS'>('ACCOUNTS');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerAccountFilter, setLedgerAccountFilter] = useState<string>('ALL');

  // Modal States
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositModalAccount, setDepositModalAccount] = useState<FinanceAccount | null>(null);
  const [expenseAccountId, setExpenseAccountId] = useState<string | null>(null);
  const [transferAccountId, setTransferAccountId] = useState<string | null>(null);
  const [statementAccountId, setStatementAccountId] = useState<string | null>(null);
  const [editAccount, setEditAccount] = useState<FinanceAccount | null>(null);

  // Queries
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isFetching: isFetchingAccounts,
    refetch: refetchAccounts,
  } = useGetAccountsQuery();

  const {
    data: transactionsData,
    isLoading: isLoadingTxns,
    refetch: refetchTxns,
  } = useGetTransactionsQuery(
    { limit: 50 },
    { skip: activeTab !== 'TRANSACTIONS' },
  );

  const {
    data: transfersData,
    isLoading: isLoadingTransfers,
    refetch: refetchTransfers,
  } = useGetTransfersQuery(undefined, {
    skip: activeTab !== 'TRANSFERS',
  });

  const accounts: FinanceAccount[] = useMemo(() => {
    if (Array.isArray(accountsData)) return accountsData;
    if (Array.isArray((accountsData as any)?.items)) return (accountsData as any).items;
    if (Array.isArray((accountsData as any)?.data?.items)) return (accountsData as any).data.items;
    if (Array.isArray((accountsData as any)?.data)) return (accountsData as any).data;
    if (Array.isArray((accountsData as any)?.accounts)) return (accountsData as any).accounts;
    return [];
  }, [accountsData]);

  // Aggregate Metrics
  const totalBalance = useMemo(() => {
    return accounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [accounts]);

  const bankAndCardBalance = useMemo(() => {
    return accounts
      .filter((a) => a.isActive && (a.type === 'BANK' || a.type === 'CARD'))
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [accounts]);

  const cashBalance = useMemo(() => {
    return accounts
      .filter((a) => a.isActive && a.type === 'CASH')
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [accounts]);

  const digitalWalletBalance = useMemo(() => {
    return accounts
      .filter((a) => a.isActive && (a.type === 'DIGITAL_WALLET' || a.type === 'PAYMENT_GATEWAY'))
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [accounts]);

  const defaultAccount = accounts.find((a) => a.isDefault);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesType = typeFilter === 'ALL' || acc.type === typeFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        acc.name.toLowerCase().includes(query) ||
        (acc.accountNumber && acc.accountNumber.toLowerCase().includes(query)) ||
        (acc.bankOrProviderName && acc.bankOrProviderName.toLowerCase().includes(query));
      return matchesType && matchesQuery;
    });
  }, [accounts, typeFilter, searchQuery]);

  // Transactions list
  const transactionsList: FinanceTransaction[] = useMemo(() => {
    const raw = Array.isArray(transactionsData)
      ? transactionsData
      : Array.isArray((transactionsData as any)?.items)
      ? (transactionsData as any).items
      : Array.isArray((transactionsData as any)?.transactions)
      ? (transactionsData as any).transactions
      : Array.isArray((transactionsData as any)?.data?.items)
      ? (transactionsData as any).data.items
      : [];
    if (ledgerAccountFilter === 'ALL') return raw;
    return raw.filter((t: any) => t.accountId === ledgerAccountFilter || t.toAccountId === ledgerAccountFilter);
  }, [transactionsData, ledgerAccountFilter]);

  // Transfers list
  const transfersList: FinanceTransfer[] = useMemo(() => {
    if (Array.isArray(transfersData)) return transfersData;
    if (Array.isArray((transfersData as any)?.items)) return (transfersData as any).items;
    if (Array.isArray((transfersData as any)?.data?.items)) return (transfersData as any).data.items;
    if (Array.isArray((transfersData as any)?.data)) return (transfersData as any).data;
    return [];
  }, [transfersData]);

  const handleRefreshAll = () => {
    refetchAccounts();
    if (activeTab === 'TRANSACTIONS') refetchTxns();
    if (activeTab === 'TRANSFERS') refetchTransfers();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-lg shadow-slate-900/15 shrink-0">
              <Landmark className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                Bank &amp; Cash Accounts
              </h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Manage bank accounts, cash drawers, mobile wallets &amp; internal fund transfers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTransferAccountId(defaultAccount?.id || (accounts[0] ? accounts[0].id : ''))}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Transfer Funds
            </button>
            <button
              type="button"
              onClick={() => setIsCreateAccountOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Account
            </button>
          </div>
        </div>

        {/* Action Toolbar Row */}
        <div className="flex items-center gap-1 px-4 py-2.5 bg-slate-50/50">
          <button
            type="button"
            onClick={handleRefreshAll}
            title="Refresh accounts"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAccounts ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

          <button
            type="button"
            onClick={() => {
              setDepositModalAccount(defaultAccount || accounts[0] || null);
              setIsDepositOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
            Add Money (Deposit)
          </button>

          <button
            type="button"
            onClick={() => setExpenseAccountId(defaultAccount?.id || (accounts[0] ? accounts[0].id : ''))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            Record Expense (Payment)
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

          <button
            type="button"
            onClick={() => setTransferAccountId(defaultAccount?.id || (accounts[0] ? accounts[0].id : ''))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
            Transfer Funds (From ➔ To)
          </button>
        </div>
      </div>

      {/* Financial Health & Liquidity Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Liquid Reserves */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-3xl border border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-teal-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Balance</span>
            <Wallet className="w-4 h-4" />
          </div>
          <p className="text-xl font-black font-mono tracking-tight text-white">{formatMoney(totalBalance)}</p>
          <span className="text-[10px] font-semibold text-teal-300">Across {accounts.length} Accounts</span>
        </div>

        {/* Bank & Cards Balance */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Banks &amp; Cards</span>
            <Landmark className="w-4 h-4" />
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">{formatMoney(bankAndCardBalance)}</p>
          <span className="text-[10px] font-semibold text-blue-600">Commercial Bank Accounts</span>
        </div>

        {/* Cash in Hand */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash in Hand</span>
            <Banknote className="w-4 h-4" />
          </div>
          <p className="text-lg font-black text-emerald-700 font-mono tracking-tight">{formatMoney(cashBalance)}</p>
          <span className="text-[10px] font-semibold text-emerald-600">Drawer &amp; Petty Cash</span>
        </div>

        {/* Mobile & Gateways (bKash/Nagad) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-pink-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile Wallets</span>
            <Smartphone className="w-4 h-4" />
          </div>
          <p className="text-lg font-black text-pink-700 font-mono tracking-tight">{formatMoney(digitalWalletBalance)}</p>
          <span className="text-[10px] font-semibold text-pink-600">bKash, Nagad &amp; Gateways</span>
        </div>

        {/* Primary Account Info */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Default</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-sm font-black text-slate-900 truncate">
            {defaultAccount ? defaultAccount.name : 'Not set'}
          </p>
          <span className="text-[10px] font-semibold text-slate-500">
            {defaultAccount ? `${defaultAccount.type} (${formatMoney(defaultAccount.currentBalance)})` : 'Click edit to set default'}
          </span>
        </div>
      </div>

      {/* Main Sub-Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'ACCOUNTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Accounts &amp; Wallets ({accounts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRANSFERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'TRANSFERS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Inter-Account Transfers (From ➔ To)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Live Accounts Ledger
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/accounts/bank-reconciliation"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition whitespace-nowrap"
          >
            <span>Bank Reconciliation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard/accounts/chart-of-accounts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition whitespace-nowrap"
          >
            <span>Chart of Accounts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── TAB 1: ACCOUNTS CARDS GRID ─────────────────────────────── */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          {/* Controls: Filter by Type & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Accounts', count: accounts.length },
                { id: 'BANK', label: 'Bank Accounts', count: accounts.filter((a) => a.type === 'BANK').length },
                { id: 'CARD', label: 'Cards', count: accounts.filter((a) => a.type === 'CARD').length },
                { id: 'CASH', label: 'Cash Drawers', count: accounts.filter((a) => a.type === 'CASH').length },
                { id: 'DIGITAL_WALLET', label: 'Mobile Wallets', count: accounts.filter((a) => a.type === 'DIGITAL_WALLET').length },
                { id: 'PAYMENT_GATEWAY', label: 'Gateways', count: accounts.filter((a) => a.type === 'PAYMENT_GATEWAY').length },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTypeFilter(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    typeFilter === item.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-md ${
                      typeFilter === item.id ? 'bg-blue-500/50 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account or number..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Accounts Grid */}
          {isLoadingAccounts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 bg-white border border-slate-200 rounded-3xl animate-pulse p-6" />
              ))}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Landmark className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No accounts found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add bank accounts, cash counters, or mobile wallets (bKash/Nagad) to manage balances, deductions, and deposits.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateAccountOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Add New Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account) => {
                const theme = getCardTheme(account);

                return (
                  <div
                    key={account.id}
                    className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    {/* ── Realistic Physical Debit/Credit Card ── */}
                    <div
                      onClick={() => setStatementAccountId(account.id)}
                      className={`relative p-5 sm:p-6 bg-gradient-to-br ${theme.gradient} text-white min-h-[220px] flex flex-col justify-between overflow-hidden select-none cursor-pointer group-hover:scale-[1.01] transition-transform`}
                      title="Click card to view this account's debits, credits & last month balance"
                    >
                      {/* Ambient Holographic Glow & Radial Highlights */}
                      <div className={`absolute -top-12 -right-12 w-44 h-44 ${theme.glow} rounded-full blur-3xl pointer-events-none`} />
                      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                      {/* Subtle Background Watermark Icon */}
                      <div className="absolute -right-6 -bottom-6 text-white/[0.04] pointer-events-none transform -rotate-12">
                        {account.type === 'BANK' && <Landmark className="w-48 h-48" />}
                        {account.type === 'CASH' && <Banknote className="w-48 h-48" />}
                        {account.type === 'DIGITAL_WALLET' && <Smartphone className="w-48 h-48" />}
                        {account.type === 'CARD' && <CreditCard className="w-48 h-48" />}
                        {account.type === 'PAYMENT_GATEWAY' && <Globe className="w-48 h-48" />}
                      </div>

                      {/* Card Header: Network / Bank Name + Default Star + Edit Button */}
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15 text-white shadow-xs">
                            {account.type === 'BANK' && <Landmark className="w-3.5 h-3.5" />}
                            {account.type === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                            {account.type === 'DIGITAL_WALLET' && <Smartphone className="w-3.5 h-3.5" />}
                            {account.type === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                            {account.type === 'PAYMENT_GATEWAY' && <Globe className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/95 block leading-tight">
                              {theme.network}
                            </span>
                            <span className="text-[9px] font-mono tracking-widest text-white/60 uppercase">
                              {theme.networkType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {account.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1 tracking-wide">
                              <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                              DEFAULT
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditAccount(account);
                            }}
                            title="Configure Account"
                            className="p-1.5 text-white/60 hover:text-white hover:bg-white/15 rounded-full transition backdrop-blur-xs"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Middle: Dynamic based on account type */}
                      <div className="relative z-10 my-3 flex items-center justify-between">
                        {account.type === 'CARD' ? (
                          <>
                            <div className="flex items-center gap-3">
                              {/* Realistic EMV Smart Chip */}
                              <div className={`relative w-11 h-8 rounded-md bg-gradient-to-br ${theme.chipColor} p-0.5 shadow-md border border-amber-300/40 shrink-0`}>
                                <div className="w-full h-full border border-amber-900/30 rounded-[3px] grid grid-cols-2 gap-0.5 p-0.5">
                                  <div className="border-r border-b border-amber-900/30 rounded-tl-[2px]" />
                                  <div className="border-l border-b border-amber-900/30 rounded-tr-[2px]" />
                                  <div className="border-r border-t border-amber-900/30 rounded-bl-[2px]" />
                                  <div className="border-l border-t border-amber-900/30 rounded-br-[2px]" />
                                </div>
                              </div>
                              {/* Contactless waves */}
                              <Wifi className="w-4 h-4 text-white/50 rotate-90" />
                            </div>

                            {/* Card brand visual seal */}
                            <div className="flex -space-x-2 opacity-85">
                              <div className="w-5 h-5 rounded-full bg-red-500/80 backdrop-blur-xs shadow-xs" />
                              <div className="w-5 h-5 rounded-full bg-amber-400/80 backdrop-blur-xs shadow-xs" />
                            </div>
                          </>
                        ) : account.type === 'CASH' ? (
                          <>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                              <Banknote className="w-4 h-4 text-emerald-300" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                                PHYSICAL CASH VAULT
                              </span>
                            </div>
                            <div className="px-2.5 py-1 rounded-lg bg-emerald-400/20 border border-emerald-300/30 text-[10px] font-mono font-bold text-emerald-200 tracking-wider">
                              ৳ CASH DRAWER
                            </div>
                          </>
                        ) : account.type === 'DIGITAL_WALLET' ? (
                          <>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                              <Smartphone className="w-4 h-4 text-pink-300" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                {theme.network}
                              </span>
                            </div>
                            <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] font-mono font-bold text-pink-200 tracking-wider">
                              MFS WALLET
                            </div>
                          </>
                        ) : account.type === 'PAYMENT_GATEWAY' ? (
                          <>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                              <Globe className="w-4 h-4 text-cyan-300" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200">
                                ONLINE GATEWAY
                              </span>
                            </div>
                            <div className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-[10px] font-mono font-bold text-cyan-200 tracking-wider">
                              SETTLEMENT
                            </div>
                          </>
                        ) : (
                          /* Commercial Bank Account */
                          <>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                              <Landmark className="w-4 h-4 text-blue-300" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                {account.bankOrProviderName || 'COMMERCIAL BANK'}
                              </span>
                            </div>
                            <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] font-mono font-bold text-blue-200 tracking-wider">
                              OFFICIAL A/C
                            </div>
                          </>
                        )}
                      </div>

                      {/* Monospace Account Number Display */}
                      {account.type === 'CASH' ? (
                        <div className="relative z-10 py-1">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-400/30 text-emerald-200 font-mono text-[11px] font-bold tracking-wider">
                            <span>NO ACCOUNT NUMBER • HAND CASH / VAULT</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative z-10 font-mono tracking-[0.16em] text-white/95 text-[13px] sm:text-[14px] font-bold drop-shadow-sm select-all flex items-center gap-2">
                          <span className="text-white/60 text-xs font-medium tracking-wider">
                            {account.type === 'CARD'
                              ? 'CARD:'
                              : account.type === 'DIGITAL_WALLET'
                              ? 'WALLET:'
                              : account.type === 'PAYMENT_GATEWAY'
                              ? 'MERCHANT:'
                              : 'A/C:'}
                          </span>
                          <span className="tracking-[0.18em]">
                            {account.accountNumber
                              ? formatVisibleAccountNumber(account.accountNumber)
                              : 'NOT SPECIFIED'}
                          </span>
                        </div>
                      )}

                      {/* Card Footer: Available Balance & Account Title */}
                      <div className="relative z-10 mt-3 pt-3 border-t border-white/10 flex items-end justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-white/60 block mb-0.5">
                            AVAILABLE BALANCE
                          </span>
                          <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                            {formatMoney(account.currentBalance)}
                          </p>
                        </div>

                        <div className="text-right max-w-[150px]">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-white/60 block mb-0.5">
                            ACCOUNT NAME
                          </span>
                          <p className="text-xs font-black uppercase tracking-wider text-white/90 truncate">
                            {account.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Action Toolbar Beneath The Physical Card ── */}
                    <div className="p-3 bg-slate-50/90 border-t border-slate-100 grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDepositModalAccount(account);
                          setIsDepositOpen(true);
                        }}
                        className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 shadow-2xs transition group/btn"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600 group-hover/btn:scale-110 transition" />
                        <span className="text-[10px] font-extrabold tracking-tight">Deposit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpenseAccountId(account.id)}
                        className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200/80 hover:border-rose-200 shadow-2xs transition group/btn"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 group-hover/btn:scale-110 transition" />
                        <span className="text-[10px] font-extrabold tracking-tight">Expense</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferAccountId(account.id)}
                        className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-200 shadow-2xs transition group/btn"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600 group-hover/btn:scale-110 transition" />
                        <span className="text-[10px] font-extrabold tracking-tight">Transfer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatementAccountId(account.id)}
                        className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 shadow-2xs transition group/btn"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500 group-hover/btn:scale-110 transition" />
                        <span className="text-[10px] font-extrabold tracking-tight">Ledger</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: INTER-ACCOUNT TRANSFERS LOG ("From ➔ To") ─────── */}
      {activeTab === 'TRANSFERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inter-Account Fund Transfers</h3>
              <p className="text-xs text-slate-500">
                Log of internal money movements (কোন একাউন্ট থেকে কাটবে ➔ কোন একাউন্টে জমা হবে)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTransferAccountId(defaultAccount?.id || (accounts[0] ? accounts[0].id : ''))}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition self-start sm:self-auto"
            >
              <ArrowLeftRight className="w-4 h-4" />
              + New Transfer
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Transfer #</th>
                    <th className="py-3 px-4">From Account (কাটবে)</th>
                    <th className="py-3 px-4 text-center">Movement</th>
                    <th className="py-3 px-4">To Account (যোগ হবে)</th>
                    <th className="py-3 px-4 text-right">Transfer Fee</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {isLoadingTransfers ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Loading transfer history...
                      </td>
                    </tr>
                  ) : transfersList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No internal transfers recorded yet. Click &quot;+ New Transfer&quot; to transfer funds between accounts.
                      </td>
                    </tr>
                  ) : (
                    transfersList.map((trf) => {
                      const fromAcc = accounts.find((a) => a.id === trf.fromAccountId);
                      const toAcc = accounts.find((a) => a.id === trf.toAccountId);
                      return (
                        <tr key={trf.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {trf.transferDate ? new Date(trf.transferDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {trf.transferNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-900 block">{fromAcc?.name || 'Source Account'}</span>
                                <span className="text-[10px] text-slate-400">{fromAcc?.type}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500">
                              ➔
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-900 block">{toAcc?.name || 'Destination Account'}</span>
                                <span className="text-[10px] text-slate-400">{toAcc?.type}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500 font-bold">
                            {Number(trf.fee) > 0 ? formatMoney(trf.fee) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-600">
                            {formatMoney(trf.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {trf.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: LIVE ACCOUNTS LEDGER ────────────────────────────── */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Accounts Ledger</h3>
              <p className="text-xs text-slate-500">Detailed debit and credit ledger of transactions across all accounts</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Account:</label>
              <select
                value={ledgerAccountFilter}
                onChange={(e) => setLedgerAccountFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Financial Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Txn #</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Debit (- Out)</th>
                    <th className="py-3 px-4 text-right">Credit (+ In)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {isLoadingTxns ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading transaction ledger...
                      </td>
                    </tr>
                  ) : transactionsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No transactions found for the selected account filter.
                      </td>
                    </tr>
                  ) : (
                    transactionsList.map((tx: any) => {
                      const isExpense = tx.type === 'EXPENSE' || tx.type === 'PAYMENT';
                      const acc = accounts.find((a) => a.id === tx.accountId);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {tx.transactionNumber}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {acc?.name || tx.account?.name || 'General Account'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isExpense
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                            {tx.description || tx.reference || '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                            {isExpense ? formatMoney(tx.amount) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {!isExpense ? formatMoney(tx.amount) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ─────────────────────────────────────────────────── */}
      {/* 1. Add Financial Account Modal */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
      />

      {/* 2. Deposit / Add Money Modal */}
      <DepositToAccountModal
        isOpen={isDepositOpen}
        onClose={() => {
          setIsDepositOpen(false);
          setDepositModalAccount(null);
        }}
        account={depositModalAccount}
      />

      {/* 3. Record Expense Modal */}
      <CreateExpenseModal
        isOpen={Boolean(expenseAccountId)}
        onClose={() => setExpenseAccountId(null)}
        initialAccountId={expenseAccountId || undefined}
      />

      {/* 4. Fund Transfer Modal (From Account -> To Account) */}
      <CreateTransferModal
        isOpen={Boolean(transferAccountId)}
        onClose={() => setTransferAccountId(null)}
        initialFromAccountId={transferAccountId || undefined}
      />

      {/* 5. Account Statement & Ledger Modal */}
      <AccountStatementModal
        isOpen={Boolean(statementAccountId)}
        onClose={() => setStatementAccountId(null)}
        accountId={statementAccountId}
      />

      {/* 6. Edit / Configure Account Modal */}
      <EditAccountModal
        isOpen={Boolean(editAccount)}
        onClose={() => setEditAccount(null)}
        account={editAccount}
      />
    </div>
  );
}
