'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  History,
  Download,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Scale,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Paperclip,
  X,
  FileText,
  DollarSign,
  ArrowUpDown,
  Building,
  CheckCircle2,
} from 'lucide-react';
import {
  useGetTransactionsQuery,
  useGetAccountsQuery,
  useExportFinanceTransactionsMutation,
  FinanceAccount,
  FinanceTransaction,
} from '../api/financeApi';
import { ExpenseDetailModal } from './ExpenseDetailModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMoney(amount: number | string, prefix = '৳') {
  const val = Number(amount || 0);
  return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceHistoryView() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Default to Previous Month for Historical Analysis
  const defaultHistoricalMonth = currentMonth > 1 ? currentMonth - 1 : 12;
  const defaultHistoricalYear = currentMonth > 1 ? currentYear : currentYear - 1;

  const [selectedYear, setSelectedYear] = useState<number>(defaultHistoricalYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultHistoricalMonth);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryCode, setCategoryCode] = useState('');
  const [accountId, setAccountId] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [selectedDetailTransaction, setSelectedDetailTransaction] = useState<FinanceTransaction | null>(null);

  // Compute date range for selected month
  let computedStartDate = startDate;
  let computedEndDate = endDate;
  if (selectedMonth > 0 && !startDate && !endDate) {
    computedStartDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
    computedEndDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
  } else if (selectedMonth === 0 && !startDate && !endDate) {
    computedStartDate = `${selectedYear}-01-01`;
    computedEndDate = `${selectedYear}-12-31`;
  }

  const { data, isLoading, isFetching, refetch } = useGetTransactionsQuery({
    type: typeFilter === 'ALL' ? undefined : (typeFilter as any),
    categoryCode: categoryCode || undefined,
    accountId: accountId || undefined,
    search: search ? search.trim() : undefined,
    startDate: computedStartDate || undefined,
    endDate: computedEndDate || undefined,
    page,
    limit,
  });

  const [exportTransactions, { isLoading: isExporting }] = useExportFinanceTransactionsMutation();

  const { data: accountsData } = useGetAccountsQuery();
  const rawAccounts = (accountsData as any)?.data !== undefined ? (accountsData as any).data : accountsData;
  const accounts: FinanceAccount[] = Array.isArray(rawAccounts)
    ? rawAccounts
    : (rawAccounts as any)?.items || [];

  const rawData = (data as any)?.data !== undefined ? (data as any).data : data;
  const transactionList: FinanceTransaction[] = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData)
    ? rawData
    : [];
  const totalCount = Number(rawData?.total || transactionList.length || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit) || rawData?.totalPages || 1);

  // Calculate historical totals
  const totalIncome = transactionList
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalExpense = transactionList
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const handleExport = async (type?: 'INCOME' | 'EXPENSE' | undefined) => {
    try {
      const res = await exportTransactions({
        year: selectedYear,
        month: selectedMonth === 0 ? undefined : selectedMonth,
        type,
        categoryCode: categoryCode || undefined,
      }).unwrap();

      if (res?.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const typeSuffix = type ? `_${type.toLowerCase()}` : '_combined';
        link.setAttribute('download', res.filename || `finance_history_${selectedYear}_${selectedMonth}${typeSuffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Historical CSV report exported successfully.');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to export history CSV.');
    }
  };

  const setPreviousMonthPreset = () => {
    setSelectedYear(defaultHistoricalYear);
    setSelectedMonth(defaultHistoricalMonth);
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const setCurrentMonthPreset = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const setAllYearPreset = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(0);
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

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

  const startEntry = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-6">
      {/* Top Header Card with Historical Period Controls & Export Suite */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial History & Archives</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedMonth > 0 ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}` : `Full Year ${selectedYear}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Inspect historical records across previous months, audit past cashflows, and export comprehensive CSV statements
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Period Selector & Export Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Preset Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={setPreviousMonthPreset}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedMonth === defaultHistoricalMonth && selectedYear === defaultHistoricalYear && !startDate
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Previous Month
            </button>
            <button
              type="button"
              onClick={setCurrentMonthPreset}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedMonth === currentMonth && selectedYear === currentYear && !startDate
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={setAllYearPreset}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedMonth === 0 && selectedYear === currentYear && !startDate
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Year ({currentYear})
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value={0}>All Months</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Historical Data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Historical KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflows */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Historical Income</p>
            <p className="text-2xl font-black text-emerald-600">{formatMoney(totalIncome, '+৳')}</p>
            <p className="text-[10px] text-slate-400 font-medium">Customer sales & courier COD</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Outflows */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Historical Expenses</p>
            <p className="text-2xl font-black text-rose-600">{formatMoney(totalExpense, '-৳')}</p>
            <p className="text-[10px] text-slate-400 font-medium">COGS, salaries, ads & overhead</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit / Surplus */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Archive Profit</p>
            <p className={`text-2xl font-black ${netBalance >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
              {formatMoney(Math.abs(netBalance), netBalance >= 0 ? '৳' : '-৳')}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Net margin for selected period</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Total Historical Volume & Export Suite Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Export Statement</p>
              <p className="text-2xl font-black text-slate-900">{totalCount} Transactions</p>
              <p className="text-[10px] text-slate-400 font-medium">Download formatted CSV ledger</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-3 mt-1 border-t border-slate-100">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport(undefined)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>All CSV</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport('INCOME')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              title="Download Income Only CSV"
            >
              <span>+ Income</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport('EXPENSE')}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              title="Download Expense Only CSV"
            >
              <span>- Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        {/* Stream Toggle Tabs: All, Incomes, Expenses */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('ALL');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('INCOME');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                typeFilter === 'INCOME' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Incomes Only</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('EXPENSE');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                typeFilter === 'EXPENSE' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Expenses Only</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Page Size:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value={10}>10 records</option>
              <option value={20}>20 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>
        </div>

        {/* Detailed Search & Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search historical description, txn #, reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Account Filter */}
          <div className="lg:col-span-4">
            <select
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-4">
            <select
              value={categoryCode}
              onChange={(e) => {
                setCategoryCode(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="PRODUCT_SALES">Product Sales (COD & Online)</option>
              <option value="SHIPPING_INCOME">Shipping Fees</option>
              <option value="COGS">COGS (Product Cost)</option>
              <option value="SALARY">Salaries & Payroll</option>
              <option value="SHIPPING">Courier Logistics</option>
              <option value="MARKETING">Marketing & Advertising</option>
              <option value="RENT">Rent & Facilities</option>
              <option value="UTILITIES">Utilities & Power</option>
              <option value="OTHER">Other Categories</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historical Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs animate-pulse flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="font-semibold">Loading historical ledger records...</p>
          </div>
        ) : transactionList.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No historical records found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                No matching transactions recorded for {selectedMonth > 0 ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}` : `Year ${selectedYear}`}.
              </p>
            </div>
            <button
              type="button"
              onClick={setPreviousMonthPreset}
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Load Previous Month
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Txn #</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Account</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Recorded By</th>
                  <th className="px-5 py-3.5 text-right">Amount (BDT)</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactionList.map((t) => {
                  const isIncome = t.type === 'INCOME';
                  const isExpense = t.type === 'EXPENSE';

                  const creatorName =
                    t.createdByUser?.fullName || t.createdByUser?.email || 'System Auto';
                  const creatorId =
                    t.createdByUser?.id || t.createdByUserId || 'SYS';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedDetailTransaction(t)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                      title="Click row to view full details"
                    >
                      <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                        {String(t.transactionDate || '').split('T')[0]}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap group-hover:text-indigo-600 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span>{t.transactionNumber}</span>
                          {(t.receiptFileId || t.receiptFile) && (
                            <span
                              className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200"
                              title="Receipt file attached"
                            >
                              <Paperclip className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black border ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isExpense
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800">
                          {t.category?.name || t.categoryCode?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <span className="font-medium text-slate-900 block truncate" title={t.description || ''}>
                          {t.description || '—'}
                        </span>
                        {t.reference && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Ref: {t.reference}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                        {t.account?.name || 'Cash on Hand'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                        {t.paymentMethod || 'CASH'}
                      </td>

                      {/* Recorded By */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shrink-0">
                            {creatorName[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate text-[11px]" title={creatorName}>
                              {creatorName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              ID: {creatorId.substring(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td
                        className={`px-5 py-3.5 font-black text-right whitespace-nowrap ${
                          isIncome ? 'text-emerald-600' : isExpense ? 'text-rose-600' : 'text-indigo-600'
                        }`}
                      >
                        {formatMoney(t.amount, isIncome ? '+৳' : isExpense ? '-৳' : '৳')}
                      </td>

                      {/* View Action */}
                      <td
                        className="px-4 py-3.5 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedDetailTransaction(t)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Numbered Pagination */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="font-medium text-slate-600">
            Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
            <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
            <span className="font-bold text-slate-900">{totalCount}</span> historical entries
          </div>

          {totalCount > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 mx-1">
                {getPaginationNumbers().map((num, idx) => {
                  if (num === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(num);
                  const isCurrent = pageNum === page;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs'
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
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      <ExpenseDetailModal
        isOpen={Boolean(selectedDetailTransaction)}
        onClose={() => setSelectedDetailTransaction(null)}
        expense={selectedDetailTransaction}
        isAdmin={true}
      />
    </div>
  );
}
