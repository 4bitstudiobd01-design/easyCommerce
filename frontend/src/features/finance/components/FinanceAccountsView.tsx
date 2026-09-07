'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
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
  ShieldAlert,
  CheckCircle2,
  Star,
  Settings2,
  FileText,
  Lock,
  Wallet,
  Building2,
  Receipt,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { RootState } from '@/store';
import { useGetMyPermissionsQuery } from '@/features/staff/api/staffApi';
import {
  useGetAccountsQuery,
  useGetTransactionsQuery,
  useGetTransfersQuery,
  FinanceAccount,
  FinanceAccountType,
  FinanceTransaction,
  FinanceTransfer,
} from '../api/financeApi';
import { CreateAccountModal } from './CreateAccountModal';
import { DepositToAccountModal } from './DepositToAccountModal';
import { EditAccountModal } from './EditAccountModal';
import { AccountStatementModal } from './AccountStatementModal';
import { CreateExpenseModal } from './CreateExpenseModal';
import { CreateIncomeModal } from './CreateIncomeModal';
import { CreateTransferModal } from './CreateTransferModal';

type TabView = 'ACCOUNTS' | 'TRANSACTIONS' | 'TRANSFERS';

function formatMoney(amount: number | string | undefined | null) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceAccountsView() {
  const [activeTab, setActiveTab] = useState<TabView>('ACCOUNTS');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [depositModalAccount, setDepositModalAccount] = useState<FinanceAccount | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [incomeAccountId, setIncomeAccountId] = useState<string | null>(null);
  const [expenseAccountId, setExpenseAccountId] = useState<string | null>(null);
  const [transferAccountId, setTransferAccountId] = useState<string | null>(null);
  const [statementAccountId, setStatementAccountId] = useState<string | null>(null);
  const [editAccount, setEditAccount] = useState<FinanceAccount | null>(null);

  // Filter for Ledger tab
  const [ledgerAccountFilter, setLedgerAccountFilter] = useState<string>('ALL');

  // Redux Auth User
  const authUser = useSelector((state: RootState) => state.auth?.user);
  const { data: myPermissions, isLoading: isCheckingPermissions } = useGetMyPermissionsQuery();

  // RBAC Access Verification
  const userRole = (authUser?.role || myPermissions?.role || '').toUpperCase();
  const permissions = myPermissions?.permissions || [];
  const isOwner = Boolean(myPermissions?.isOwner || userRole === 'STORE_OWNER' || userRole === 'SUPER_ADMIN');

  const isAuthorized =
    isOwner ||
    userRole === 'SUPER_ADMIN' ||
    userRole === 'STORE_OWNER' ||
    userRole === 'ADMIN' ||
    userRole === 'FINANCE' ||
    permissions.includes('finance:manage') ||
    permissions.includes('finance:accounts:manage') ||
    permissions.includes('finance:read');

  // Queries
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isFetching: isFetchingAccounts,
    refetch: refetchAccounts,
  } = useGetAccountsQuery(undefined, { skip: !isAuthorized });

  const {
    data: transactionsData,
    isLoading: isLoadingTxns,
    refetch: refetchTxns,
  } = useGetTransactionsQuery(
    { limit: 50 },
    { skip: !isAuthorized || activeTab !== 'TRANSACTIONS' },
  );

  const {
    data: transfersData,
    isLoading: isLoadingTransfers,
    refetch: refetchTransfers,
  } = useGetTransfersQuery(undefined, {
    skip: !isAuthorized || activeTab !== 'TRANSFERS',
  });

  const accounts: FinanceAccount[] = useMemo(() => {
    if (Array.isArray(accountsData)) return accountsData;
    if (Array.isArray((accountsData as any)?.items)) return (accountsData as any).items;
    if (Array.isArray((accountsData as any)?.data?.items)) return (accountsData as any).data.items;
    if (Array.isArray((accountsData as any)?.data)) return (accountsData as any).data;
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
      const matchesSearch =
        !query ||
        acc.name?.toLowerCase().includes(query) ||
        acc.bankOrProviderName?.toLowerCase().includes(query) ||
        acc.accountNumber?.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [accounts, typeFilter, searchQuery]);

  // Filtered Transactions for Live Ledger
  const transactionsList: FinanceTransaction[] = useMemo(() => {
    const raw = Array.isArray(transactionsData)
      ? transactionsData
      : Array.isArray((transactionsData as any)?.items)
      ? (transactionsData as any).items
      : Array.isArray((transactionsData as any)?.data?.items)
      ? (transactionsData as any).data.items
      : [];
    if (ledgerAccountFilter === 'ALL') return raw;
    return raw.filter((t) => t.accountId === ledgerAccountFilter || t.toAccountId === ledgerAccountFilter);
  }, [transactionsData, ledgerAccountFilter]);

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

  // ─── 1. ACCESS RESTRICTED SCREEN (RBAC) ──────────────────────────
  if (!isCheckingPermissions && !isAuthorized) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-rose-100 rounded-3xl p-8 text-center shadow-xl shadow-rose-500/5 space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
              Financial accounts, liquidity reserves, and fund management are strictly
              restricted to <strong>Administrator</strong> and <strong>Finance</strong> personnel.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Your Current Session:</p>
            <p>Role: <span className="font-mono font-semibold text-slate-700">{userRole || 'STAFF'}</span></p>
            <p>Required: <span className="font-mono text-blue-600">admin</span> or <span className="font-mono text-blue-600">finance:manage</span></p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ─── 2. MAIN FINANCIAL ACCOUNTS HUB ─────────────────────────────
  return (
    <div className="space-y-6">
      {/* Top Header Card — Professional two-section layout */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-lg shadow-slate-900/15 flex-shrink-0">
              <Landmark className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                Financial Accounts &amp; Wallets
              </h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Bank accounts, cards, cash drawers &amp; mobile gateways
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all duration-150 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>

        {/* Action Toolbar Row */}
        <div className="flex items-center gap-1 px-4 py-2.5">
          <button
            type="button"
            onClick={handleRefreshAll}
            title="Refresh accounts"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAccounts ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

          <button
            type="button"
            onClick={() => {
              setDepositModalAccount(defaultAccount || accounts[0] || null);
              setIsDepositOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 border border-transparent hover:border-blue-200"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
            Add Money
          </button>

          <button
            type="button"
            onClick={() => setExpenseAccountId(defaultAccount?.id || (accounts[0] ? accounts[0].id : ''))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 border border-transparent hover:border-blue-200"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
            Record Expense
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

          <button
            type="button"
            onClick={() => setTransferAccountId(defaultAccount?.id || (accounts[0] ? accounts[0].id : ''))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 border border-transparent hover:border-blue-200"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            Transfer Funds
          </button>
        </div>
      </div>

      {/* Financial Health & Liquidity Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Liquid Reserves */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-3xl border border-slate-800 shadow-md shadow-slate-900/5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-teal-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Liquid Funds</span>
            <Wallet className="w-4 h-4" />
          </div>
          <p className="text-xl font-black font-mono tracking-tight text-white">{formatMoney(totalBalance)}</p>
          <span className="text-[10px] font-semibold text-teal-300">Across {accounts.length} Accounts</span>
        </div>

        {/* Bank & Cards Balance */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Banks & Cards</span>
            <Landmark className="w-4 h-4" />
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">{formatMoney(bankAndCardBalance)}</p>
          <span className="text-[10px] font-semibold text-blue-600">Operating & Plastic</span>
        </div>

        {/* Cash in Hand */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash in Hand</span>
            <Banknote className="w-4 h-4" />
          </div>
          <p className="text-lg font-black text-emerald-700 font-mono tracking-tight">{formatMoney(cashBalance)}</p>
          <span className="text-[10px] font-semibold text-emerald-600">Drawer & Petty Cash</span>
        </div>

        {/* Mobile & Gateways (bKash/Nagad) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-pink-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile & Gateways</span>
            <Smartphone className="w-4 h-4" />
          </div>
          <p className="text-lg font-black text-pink-700 font-mono tracking-tight">{formatMoney(digitalWalletBalance)}</p>
          <span className="text-[10px] font-semibold text-pink-600">bKash, Nagad & Online</span>
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
            Accounts & Wallets ({accounts.length})
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
            Inter-Account Transfers
          </button>
        </div>

        <Link
          href="/dashboard/finance/chart-of-accounts"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition"
        >
          <span>Chart of Accounts</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
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
              <h3 className="text-base font-bold text-slate-900">No accounts match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add multiple bank accounts, cards, cash counters, or mobile wallets (bKash/Nagad) to track balances and transactions.
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
                const isBank = account.type === 'BANK';
                const isCard = account.type === 'CARD';
                const isCash = account.type === 'CASH';
                const isWallet = account.type === 'DIGITAL_WALLET';
                const isGateway = account.type === 'PAYMENT_GATEWAY';

                // Skin styling per account type
                let cardGradient = 'from-slate-900 via-slate-800 to-slate-900';
                let accentColor = 'text-blue-400';
                let typeIcon = Landmark;

                if (isBank) {
                  cardGradient = 'from-slate-950 via-slate-900 to-blue-950';
                  accentColor = 'text-blue-400';
                  typeIcon = Landmark;
                } else if (isCard) {
                  cardGradient = 'from-slate-950 via-purple-950 to-slate-900';
                  accentColor = 'text-purple-400';
                  typeIcon = CreditCard;
                } else if (isCash) {
                  cardGradient = 'from-slate-950 via-teal-950 to-emerald-950';
                  accentColor = 'text-emerald-400';
                  typeIcon = Banknote;
                } else if (isWallet) {
                  const isBkash = account.name.toLowerCase().includes('bkash') || account.bankOrProviderName?.toLowerCase().includes('bkash');
                  const isNagad = account.name.toLowerCase().includes('nagad') || account.bankOrProviderName?.toLowerCase().includes('nagad');
                  if (isBkash) {
                    cardGradient = 'from-slate-950 via-pink-950 to-rose-950';
                    accentColor = 'text-pink-400';
                  } else if (isNagad) {
                    cardGradient = 'from-slate-950 via-orange-950 to-amber-950';
                    accentColor = 'text-orange-400';
                  } else {
                    cardGradient = 'from-slate-950 via-purple-950 to-indigo-950';
                    accentColor = 'text-purple-400';
                  }
                  typeIcon = Smartphone;
                } else if (isGateway) {
                  cardGradient = 'from-slate-950 via-cyan-950 to-slate-900';
                  accentColor = 'text-cyan-400';
                  typeIcon = Globe;
                }

                const TypeIconComponent = typeIcon;

                return (
                  <div
                    key={account.id}
                    className="relative bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    {/* Visual Card Face Header */}
                    <div className={`p-5 bg-gradient-to-br ${cardGradient} text-white relative overflow-hidden`}>
                      {/* Abstract subtle circle overlay */}
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                      <div className="absolute right-12 top-0 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

                      <div className="flex items-start justify-between gap-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center ${accentColor}`}>
                            <TypeIconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                              {account.bankOrProviderName || account.type}
                            </span>
                            <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                              {account.name}
                            </h3>
                          </div>
                        </div>

                        {/* Top Badges */}
                        <div className="flex items-center gap-1.5">
                          {account.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              <Star className="w-2.5 h-2.5 fill-amber-300" />
                              Primary
                            </span>
                          )}
                          {!account.isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Account Number / Masked Card */}
                      <div className="mt-4 pt-2 flex items-center justify-between border-t border-white/10 relative z-10 font-mono">
                        <span className="text-xs text-slate-300 tracking-wider">
                          {account.accountNumber || (isCash ? 'CASH DRAWER' : '•••• ••••')}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {account.currency || 'BDT'}
                        </span>
                      </div>

                      {/* Current Balance Display */}
                      <div className="mt-3 relative z-10">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                          Current Available Balance
                        </span>
                        <p className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                          {formatMoney(account.currentBalance)}
                        </p>
                      </div>
                    </div>

                    {/* Quick Action Buttons on Card Body */}
                    <div className="p-4 bg-slate-50/50 space-y-3">
                      {/* Starting balance & Notes summary */}
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                        <span>Starting: {formatMoney(account.startingBalance)}</span>
                        {account.notes && (
                          <span className="truncate max-w-[150px] text-slate-400 text-[11px]" title={account.notes}>
                            {account.notes}
                          </span>
                        )}
                      </div>

                      {/* Action Grid */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIncomeAccountId(account.id)}
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 transition shadow-2xs group/btn"
                          title="Record Income into this account"
                        >
                          <TrendingUp className="w-4 h-4 mb-0.5 text-blue-600 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">Income</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpenseAccountId(account.id)}
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 transition shadow-2xs group/btn"
                          title="Spend or pay expense from this account"
                        >
                          <ArrowUpRight className="w-4 h-4 mb-0.5 text-blue-600 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">Expense</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDepositModalAccount(account);
                            setIsDepositOpen(true);
                          }}
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 transition shadow-2xs group/btn"
                          title="Deposit money into this account"
                        >
                          <ArrowDownLeft className="w-4 h-4 mb-0.5 text-blue-600 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">Deposit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTransferAccountId(account.id)}
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 transition shadow-2xs group/btn"
                          title="Transfer money to another account"
                        >
                          <ArrowLeftRight className="w-4 h-4 mb-0.5 text-blue-600 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">Transfer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatementAccountId(account.id)}
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 transition shadow-2xs group/btn"
                          title="View complete transaction statement"
                        >
                          <FileText className="w-4 h-4 mb-0.5 text-blue-600 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">Ledger</span>
                        </button>
                      </div>

                      {/* Edit Account Footer Link */}
                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setEditAccount(account)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Configure Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: LIVE ACCOUNTS LEDGER ───────────────────────────── */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Filter By Account:</label>
              <select
                value={ledgerAccountFilter}
                onChange={(e) => setLedgerAccountFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              >
                <option value="ALL">All Financial Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => refetchTxns()}
              className="p-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition inline-flex items-center gap-1.5 self-start md:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Transactions
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {isLoadingTxns ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : transactionsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No transactions recorded for the selected account filter.
                      </td>
                    </tr>
                  ) : (
                    transactionsList.map((t) => {
                      const isIncome = t.type === 'INCOME' || t.type === 'PAYMENT';
                      const isTransfer = t.type === 'TRANSFER';
                      const acc = accounts.find((a) => a.id === t.accountId);

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {t.transactionDate}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {t.reference || t.transactionNumber}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {t.description}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700 block">
                              {acc?.name || 'Primary Account'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">
                              {acc?.type || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-semibold">
                            {t.paymentMethod || '—'}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-black text-sm ${
                            isTransfer ? 'text-blue-600' : isIncome ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {isTransfer ? formatMoney(t.amount) : isIncome ? `+${formatMoney(t.amount)}` : `-${formatMoney(t.amount)}`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {t.status}
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

      {/* ─── TAB 3: INTER-ACCOUNT TRANSFERS LOG ─────────────────────── */}
      {activeTab === 'TRANSFERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Internal Fund Transfers</h3>
              <p className="text-xs text-slate-500">Record of money moved between your banks, cash drawers, and mobile wallets</p>
            </div>
            <button
              type="button"
              onClick={() => setTransferAccountId(defaultAccount?.id || (accounts[0] ? accounts[0].id : ''))}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
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
                    <th className="py-3 px-4">From Account</th>
                    <th className="py-3 px-4">To Account</th>
                    <th className="py-3 px-4 text-right">Transfer Fee</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {isLoadingTransfers ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading transfer history...
                      </td>
                    </tr>
                  ) : transfersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No internal transfers recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transfersList.map((trf) => {
                      const fromAcc = accounts.find((a) => a.id === trf.fromAccountId);
                      const toAcc = accounts.find((a) => a.id === trf.toAccountId);
                      return (
                        <tr key={trf.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {trf.transferDate}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {trf.transferNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{fromAcc?.name || 'Source Account'}</span>
                            <span className="text-[10px] text-slate-400">{fromAcc?.type}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{toAcc?.name || 'Destination Account'}</span>
                            <span className="text-[10px] text-slate-400">{toAcc?.type}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500 font-bold">
                            {formatMoney(trf.fee)}
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

      {/* 3. Record Income Modal (with initial account preselected) */}
      <CreateIncomeModal
        isOpen={Boolean(incomeAccountId)}
        onClose={() => setIncomeAccountId(null)}
        initialAccountId={incomeAccountId || undefined}
      />

      {/* 4. Record Expense Modal (with initial account preselected) */}
      <CreateExpenseModal
        isOpen={Boolean(expenseAccountId)}
        onClose={() => setExpenseAccountId(null)}
        initialAccountId={expenseAccountId || undefined}
      />

      {/* 4. Fund Transfer Modal (with initial source account preselected) */}
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
