'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  RefreshCw,
  Building2,
  Wallet,
  CreditCard,
  History,
  CheckCircle,
  CheckCircle2,
  FolderTree,
  Receipt,
  BookOpen,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Printer,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  DollarSign,
  Layers,
  FileText,
  Users,
  Package,
  Calendar,
  Eye,
} from 'lucide-react';
import {
  useGetAccountsQuery,
  useGetChartOfAccountsQuery,
  useGetTransactionsQuery,
  useGetGeneralLedgerQuery,
  useGetInvoicesQuery,
  useGetBillsQuery,
  useGetJournalEntriesQuery,
  useGetFinanceOverviewQuery,
  FinanceAccount,
  FinanceChartOfAccount,
  FinanceInvoice,
  FinanceBill,
  FinanceTransaction,
  FinanceJournalEntry,
} from '../api/financeApi';
import { CreateAccountModal } from './CreateAccountModal';
import { CreateChartOfAccountModal } from './CreateChartOfAccountModal';
import { AccountStatementModal } from './AccountStatementModal';
import { CreateJournalEntryModal } from './CreateJournalEntryModal';
import { RecordInvoicePaymentModal } from './RecordInvoicePaymentModal';
import { RecordBillPaymentModal } from './RecordBillPaymentModal';
import { CreateTransactionModal } from './CreateTransactionModal';

type AccountsTab = 'ACCOUNTS' | 'TRANSACTIONS' | 'LEDGER' | 'RECEIVABLES_PAYABLES' | 'JOURNALS';

function formatMoney(amount: number | string | undefined | null) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CLASS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ASSET: { label: 'Asset (1000s)', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  LIABILITY: { label: 'Liability (2000s)', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  EQUITY: { label: 'Equity (3000s)', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  REVENUE: { label: 'Revenue (4000s)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  EXPENSE: { label: 'Expense (5000/6000s)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const SOURCE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  MANUAL: { label: 'Manual Journal', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
  ORDER: { label: 'Sales Order', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  REFUND: { label: 'Order Refund', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
  INVOICE: { label: 'Customer Invoice', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  BILL: { label: 'Supplier Bill', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  PAYROLL: { label: 'HRM Payroll', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  HR_EXPENSE: { label: 'Staff Reimbursement', bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
  TRANSFER: { label: 'Bank Transfer', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  INVENTORY_ADJUSTMENT: { label: 'Stock Valuation', bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-700' },
  PERIOD_CLOSING: { label: 'Period Closing', bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700' },
};

export function FinanceAccountsView() {
  const [activeTab, setActiveTab] = useState<AccountsTab>('ACCOUNTS');

  // Modals state
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isCreateChartOpen, setIsCreateChartOpen] = useState(false);
  const [isCreateJournalOpen, setIsCreateJournalOpen] = useState(false);
  const [isCreateTxnOpen, setIsCreateTxnOpen] = useState(false);
  const [statementAccountId, setStatementAccountId] = useState<string | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<FinanceInvoice | null>(null);
  const [payingBill, setPayingBill] = useState<FinanceBill | null>(null);

  // Sub-view 1: Chart of Accounts filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchCoa, setSearchCoa] = useState<string>('');

  // Sub-view 2: Transactions filters & pagination
  const [txnTypeFilter, setTxnTypeFilter] = useState<string>('');
  const [txnSearch, setTxnSearch] = useState<string>('');
  const [txnPage, setTxnPage] = useState<number>(1);
  const [txnLimit, setTxnLimit] = useState<number>(20);

  // Sub-view 3: General Ledger
  const [ledgerAccountId, setLedgerAccountId] = useState<string>('');
  const [ledgerStartDate, setLedgerStartDate] = useState<string>('');
  const [ledgerEndDate, setLedgerEndDate] = useState<string>('');

  // Sub-view 4: AR/AP Switcher
  const [arApMode, setArApMode] = useState<'RECEIVABLES' | 'PAYABLES'>('RECEIVABLES');

  // Sub-view 5: Journal Entries filters
  const [journalSourceFilter, setJournalSourceFilter] = useState<string>('');
  const [journalSearch, setJournalSearch] = useState<string>('');
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);

  // Queries
  const { data: overviewData, refetch: refetchOverview } = useGetFinanceOverviewQuery();
  const { data: accountsData, refetch: refetchAccounts } = useGetAccountsQuery();
  const { data: coaData, refetch: refetchCoa } = useGetChartOfAccountsQuery({
    accountClass: selectedClass !== 'ALL' ? selectedClass : undefined,
    search: searchCoa.trim() || undefined,
  });

  const { data: transactionsData, refetch: refetchTxn } = useGetTransactionsQuery({
    type: txnTypeFilter || undefined,
    search: txnSearch.trim() || undefined,
    page: txnPage,
    limit: txnLimit,
  });

  const txnTotal = transactionsData?.total || 0;
  const txnTotalPages = transactionsData?.totalPages || 1;
  const txnStartEntry = txnTotal === 0 ? 0 : (txnPage - 1) * txnLimit + 1;
  const txnEndEntry = Math.min(txnPage * txnLimit, txnTotal);

  const getTxnPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    if (txnTotalPages <= 7) {
      for (let i = 1; i <= txnTotalPages; i++) pages.push(i);
    } else {
      if (txnPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', txnTotalPages);
      } else if (txnPage >= txnTotalPages - 3) {
        pages.push(1, '...', txnTotalPages - 4, txnTotalPages - 3, txnTotalPages - 2, txnTotalPages - 1, txnTotalPages);
      } else {
        pages.push(1, '...', txnPage - 1, txnPage, txnPage + 1, '...', txnTotalPages);
      }
    }
    return pages;
  };

  const allCoaAccounts = coaData?.accounts || [];

  // Default ledger account to Cash (1010) or Bank (1020)
  useEffect(() => {
    if (!ledgerAccountId && allCoaAccounts.length > 0) {
      const defaultAcc = allCoaAccounts.find((a) => a.code === '1010' || a.code === '1020') || allCoaAccounts[0];
      setLedgerAccountId(defaultAcc.id);
    }
  }, [allCoaAccounts, ledgerAccountId]);

  const { data: ledgerData, refetch: refetchLedger } = useGetGeneralLedgerQuery(
    {
      accountId: ledgerAccountId,
      startDate: ledgerStartDate || undefined,
      endDate: ledgerEndDate || undefined,
    },
    { skip: !ledgerAccountId },
  );

  const { data: invoicesData, refetch: refetchInvoices } = useGetInvoicesQuery(
    { limit: 50 },
    { skip: activeTab !== 'RECEIVABLES_PAYABLES' || arApMode !== 'RECEIVABLES' },
  );

  const { data: billsData, refetch: refetchBills } = useGetBillsQuery(
    { limit: 50 },
    { skip: activeTab !== 'RECEIVABLES_PAYABLES' || arApMode !== 'PAYABLES' },
  );

  const { data: journalsData, refetch: refetchJournals } = useGetJournalEntriesQuery(
    {
      sourceType: journalSourceFilter || undefined,
      search: journalSearch.trim() || undefined,
      limit: 30,
    },
    { skip: activeTab !== 'JOURNALS' },
  );

  const handleRefreshAll = () => {
    refetchOverview();
    refetchAccounts();
    refetchCoa();
    if (activeTab === 'TRANSACTIONS') refetchTxn();
    if (activeTab === 'LEDGER') refetchLedger();
    if (activeTab === 'RECEIVABLES_PAYABLES') {
      refetchInvoices();
      refetchBills();
    }
    if (activeTab === 'JOURNALS') refetchJournals();
  };

  const handleDrillToLedger = (accountId: string) => {
    setLedgerAccountId(accountId);
    setActiveTab('LEDGER');
  };

  // Metrics calculation
  const totalCashBank =
    overviewData?.summary?.totalAccountBalance ??
    (Array.isArray(accountsData)
      ? accountsData.reduce((s, a) => s + Number(a.currentBalance || 0), 0)
      : 0);
  const totalReceivables = overviewData?.summary?.totalReceivables ?? 0;
  const totalPayables = overviewData?.summary?.totalPayables ?? 0;
  const totalInventory = overviewData?.summary?.inventoryCost ?? 0;
  const workingCapital = (totalCashBank + totalReceivables + totalInventory) - totalPayables;

  return (
    <div className="space-y-6">
      {/* ─── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
            <Landmark className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Accounts & Ledger Hub</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Chart of Accounts, Debit/Credit transactions, General Ledger, and Working Capital
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefreshAll}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateTxnOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition"
          >
            <Receipt className="w-4 h-4 text-slate-600" />
            + Transaction
          </button>
          <button
            type="button"
            onClick={() => setIsCreateChartOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition"
          >
            <FolderTree className="w-4 h-4 text-blue-600" />
            + Chart Account
          </button>
          <button
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-teal-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Bank/Cash
          </button>
        </div>
      </div>

      {/* ─── Financial Health Metrics Strip ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash & Bank</span>
            <Wallet className="w-4 h-4" />
          </div>
          <p className="text-base sm:text-lg font-black text-slate-900 font-mono">{formatMoney(totalCashBank)}</p>
          <span className="text-[10px] font-semibold text-blue-600">Liquid Funds</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receivables (AR)</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <p className="text-base sm:text-lg font-black text-emerald-700 font-mono">{formatMoney(totalReceivables)}</p>
          <span className="text-[10px] font-semibold text-emerald-600">Pending Invoices</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payables (AP)</span>
            <Scale className="w-4 h-4" />
          </div>
          <p className="text-base sm:text-lg font-black text-amber-700 font-mono">{formatMoney(totalPayables)}</p>
          <span className="text-[10px] font-semibold text-amber-600">Due to Suppliers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Asset</span>
            <Package className="w-4 h-4" />
          </div>
          <p className="text-base sm:text-lg font-black text-slate-900 font-mono">{formatMoney(totalInventory)}</p>
          <span className="text-[10px] font-semibold text-indigo-600">Stock Valuation</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-teal-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Working Capital</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-base sm:text-lg font-black font-mono text-white">{formatMoney(workingCapital)}</p>
          <span className="text-[10px] font-semibold text-teal-400">(Cash + AR + Stock) - AP</span>
        </div>
      </div>

      {/* ─── Navigation Sub-Tabs ───────────────────────────────────── */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ACCOUNTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ACCOUNTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Chart of Accounts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Debit / Credit Transactions
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'LEDGER'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          General Ledger
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RECEIVABLES_PAYABLES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'RECEIVABLES_PAYABLES'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          Receivables & Payables
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('JOURNALS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'JOURNALS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Journal Entries
        </button>
      </div>

      {/* ─── TAB 1: CHART OF ACCOUNTS ──────────────────────────────── */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          {/* Controls toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedClass === cls
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cls === 'ALL' ? 'All Classes' : cls.charAt(0) + cls.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCoa}
                onChange={(e) => setSearchCoa(e.target.value)}
                placeholder="Search account by code or name..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Normal Balance</th>
                    <th className="py-3 px-4 text-right">Current Balance</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {allCoaAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No accounts found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    allCoaAccounts.map((acc) => {
                      const badge = CLASS_BADGES[acc.accountClass] || {
                        label: acc.accountClass,
                        bg: 'bg-slate-50',
                        text: 'text-slate-700',
                        border: 'border-slate-200',
                      };
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                            {acc.code}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{acc.name}</span>
                            {acc.description && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                {acc.description}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                            {acc.normalBalance}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-slate-900">
                            {formatMoney(acc.currentBalance)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDrillToLedger(acc.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition"
                            >
                              <Eye className="w-3 h-3" />
                              View Ledger
                            </button>
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

      {/* ─── TAB 2: DEBIT / CREDIT TRANSACTIONS ────────────────────── */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { label: 'All Transactions', value: '' },
                { label: 'Income', value: 'INCOME' },
                { label: 'Expense', value: 'EXPENSE' },
                { label: 'Transfer', value: 'TRANSFER' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setTxnTypeFilter(item.value);
                    setTxnPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    txnTypeFilter === item.value
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={txnSearch}
                onChange={(e) => {
                  setTxnSearch(e.target.value);
                  setTxnPage(1);
                }}
                placeholder="Search reference or description..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(!transactionsData?.items || transactionsData.items.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No transactions recorded yet. Transactions from orders, bills, and payments sync automatically.
                      </td>
                    </tr>
                  ) : (
                    transactionsData.items.map((t: FinanceTransaction) => {
                      const isIncome = t.type === 'INCOME';
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {t.transactionDate}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {t.reference || t.id.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {t.description}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                              {t.sourceType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">
                            {t.paymentMethod || '—'}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-mono font-black text-sm ${
                            isIncome ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {isIncome ? `+${formatMoney(t.amount)}` : `-${formatMoney(t.amount)}`}
                          </td>
                          <td className="py-3.5 px-4 text-center">
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

            {/* Numbered Pagination Toolbar */}
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-600">
                  Showing <span className="font-bold text-slate-900">{txnStartEntry}</span> to{' '}
                  <span className="font-bold text-slate-900">{txnEndEntry}</span> of{' '}
                  <span className="font-bold text-slate-900">{txnTotal}</span> transactions
                </span>

                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <span className="text-[11px] text-slate-400">Rows:</span>
                  <select
                    value={txnLimit}
                    onChange={(e) => {
                      setTxnLimit(Number(e.target.value));
                      setTxnPage(1);
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

              {txnTotal > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={txnPage <= 1}
                    onClick={() => setTxnPage(1)}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={txnPage <= 1}
                    onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1 mx-1">
                    {getTxnPaginationNumbers().map((num, idx) => {
                      if (num === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold">
                            ...
                          </span>
                        );
                      }
                      const pageNum = Number(num);
                      const isCurrent = pageNum === txnPage;
                      return (
                        <button
                          key={`txn-page-${pageNum}`}
                          type="button"
                          onClick={() => setTxnPage(pageNum)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-900 text-white shadow-xs'
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
                    disabled={txnPage >= txnTotalPages}
                    onClick={() => setTxnPage((p) => Math.min(txnTotalPages, p + 1))}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={txnPage >= txnTotalPages}
                    onClick={() => setTxnPage(txnTotalPages)}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: GENERAL LEDGER ─────────────────────────────────── */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Account to Inspect
              </label>
              <select
                value={ledgerAccountId}
                onChange={(e) => setLedgerAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-teal-500 outline-hidden"
              >
                {allCoaAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({acc.accountClass})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="self-end inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          {/* Ledger summary strip */}
          {ledgerData?.account && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Opening Balance</span>
                <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                  {formatMoney(ledgerData.openingBalance)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-blue-600">Total Debits (Dr)</span>
                <p className="text-base font-black text-blue-700 font-mono mt-0.5">
                  {formatMoney(ledgerData.periodDebits)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-purple-600">Total Credits (Cr)</span>
                <p className="text-base font-black text-purple-700 font-mono mt-0.5">
                  {formatMoney(ledgerData.periodCredits)}
                </p>
              </div>
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-teal-400">Closing Balance</span>
                <p className="text-base font-black text-teal-300 font-mono mt-0.5">
                  {formatMoney(ledgerData.closingBalance)}
                </p>
              </div>
            </div>
          )}

          {/* Ledger Entries Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Debit (Dr)</th>
                    <th className="py-3 px-4 text-right">Credit (Cr)</th>
                    <th className="py-3 px-4 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(!ledgerData?.transactions || ledgerData.transactions.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No transactions found for this account in the specified timeframe.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.transactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                          {t.entryDate}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {t.entryNumber || t.reference || '—'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{t.description}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                          {t.debit > 0 ? formatMoney(t.debit) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                          {t.credit > 0 ? formatMoney(t.credit) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm text-slate-900">
                          {formatMoney(t.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: RECEIVABLES & PAYABLES ─────────────────────────── */}
      {activeTab === 'RECEIVABLES_PAYABLES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setArApMode('RECEIVABLES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  arApMode === 'RECEIVABLES'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                Customer Receivables (Invoices)
              </button>
              <button
                type="button"
                onClick={() => setArApMode('PAYABLES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  arApMode === 'PAYABLES'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Scale className="w-4 h-4" />
                Supplier Payables (Bills)
              </button>
            </div>
          </div>

          {arApMode === 'RECEIVABLES' ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Outstanding Customer Invoices</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Receivables automatically recorded from customer orders and sales invoices
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(!invoicesData?.items || invoicesData.items.length === 0) ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No customer invoices found. Orders marked as delivered will appear here.
                        </td>
                      </tr>
                    ) : (
                      invoicesData.items.map((inv: FinanceInvoice) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-black text-slate-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {inv.customerName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {inv.issueDate}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {inv.dueDate}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatMoney(inv.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-blue-700">
                            {formatMoney(inv.balanceDue)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {Number(inv.balanceDue) > 0 ? (
                              <button
                                type="button"
                                onClick={() => setPayingInvoice(inv)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Paid</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Outstanding Supplier Bills</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Payables automatically synchronized from purchase orders and vendor bills
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Bill #</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(!billsData?.items || billsData.items.length === 0) ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No supplier bills found. Purchase orders converted to bills will appear here.
                        </td>
                      </tr>
                    ) : (
                      billsData.items.map((b: FinanceBill) => (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-black text-slate-900">
                            {b.billNumber}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {b.supplierName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {b.issueDate}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {b.dueDate}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatMoney(b.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-amber-700">
                            {formatMoney(b.balanceDue)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : b.status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {Number(b.balanceDue) > 0 ? (
                              <button
                                type="button"
                                onClick={() => setPayingBill(b)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition"
                              >
                                Pay Bill
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Settled</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: JOURNAL ENTRIES ─────────────────────────────────── */}
      {activeTab === 'JOURNALS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={journalSourceFilter}
                onChange={(e) => setJournalSourceFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-hidden"
              >
                <option value="">All Source Modules</option>
                <option value="ORDER">Sales Orders</option>
                <option value="BILL">Supplier Bills</option>
                <option value="PAYROLL">HRM Payroll</option>
                <option value="HR_EXPENSE">Staff Expenses</option>
                <option value="TRANSFER">Transfers</option>
                <option value="MANUAL">Manual Journals</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  placeholder="Search journal entry..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsCreateJournalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Journal
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {(!journalsData?.items || journalsData.items.length === 0) ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No journal entries found. Operations across orders, bills, and payroll generate balanced entries here.
              </div>
            ) : (
              journalsData.items.map((entry: FinanceJournalEntry) => {
                const isExpanded = expandedJournalId === entry.id;
                const sourceBadge = SOURCE_BADGES[entry.sourceType] || {
                  label: entry.sourceType,
                  bg: 'bg-slate-50 border-slate-200',
                  text: 'text-slate-700',
                };
                return (
                  <div key={entry.id} className="p-4 hover:bg-slate-50/50 transition">
                    <div
                      onClick={() => setExpandedJournalId(isExpanded ? null : entry.id)}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-slate-900">
                              {entry.entryNumber}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${sourceBadge.bg} ${sourceBadge.text}`}
                            >
                              {sourceBadge.label}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {entry.entryDate}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 mt-1">{entry.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Total Balanced Amount
                          </span>
                          <span className="text-sm font-black font-mono text-slate-900">
                            {formatMoney(entry.totalDebit)}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Balanced
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Lines */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 pl-7">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100">
                              <th className="py-2 px-2">Account</th>
                              <th className="py-2 px-2">Memo</th>
                              <th className="py-2 px-2 text-right">Debit (Dr)</th>
                              <th className="py-2 px-2 text-right">Credit (Cr)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {entry.lines?.map((line: any) => (
                              <tr key={line.id} className="font-medium text-slate-700">
                                <td className="py-2 px-2">
                                  <span className="font-mono font-bold text-slate-900 mr-2">
                                    {line.account?.code}
                                  </span>
                                  <span>{line.account?.name}</span>
                                </td>
                                <td className="py-2 px-2 text-slate-500">{line.memo || '—'}</td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-blue-700">
                                  {Number(line.debit) > 0 ? formatMoney(line.debit) : '—'}
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-purple-700">
                                  {Number(line.credit) > 0 ? formatMoney(line.credit) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── Modals ────────────────────────────────────────────────── */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
      />
      <CreateChartOfAccountModal
        isOpen={isCreateChartOpen}
        onClose={() => setIsCreateChartOpen(false)}
      />
      <CreateJournalEntryModal
        isOpen={isCreateJournalOpen}
        onClose={() => setIsCreateJournalOpen(false)}
      />
      <CreateTransactionModal
        isOpen={isCreateTxnOpen}
        onClose={() => setIsCreateTxnOpen(false)}
      />
      <AccountStatementModal
        isOpen={!!statementAccountId}
        onClose={() => setStatementAccountId(null)}
        accountId={statementAccountId}
      />
      <RecordInvoicePaymentModal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        invoice={payingInvoice}
      />
      <RecordBillPaymentModal
        isOpen={!!payingBill}
        onClose={() => setPayingBill(null)}
        bill={payingBill}
      />
    </div>
  );
}
