'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  TrendingDown,
  Plus,
  RefreshCw,
  Search,
  Users,
  Megaphone,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Calendar,
  Truck,
  Building,
  Package,
  FileText,
  Filter,
  X,
  SlidersHorizontal,
  Wallet,
  ArrowUpDown,
  Tag,
  Edit,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Lock,
  User as UserIcon,
  Eye,
  Paperclip,
} from 'lucide-react';
import {
  useGetExpensesQuery,
  useGetAccountsQuery,
  useExportFinanceTransactionsMutation,
  useDeleteExpenseMutation,
  FinanceAccount,
  FinanceTransaction,
} from '../api/financeApi';
import { CreateExpenseModal } from './CreateExpenseModal';
import { EditExpenseModal } from './EditExpenseModal';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { Modal } from '@/components/ui/Modal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMoney(amount: number | string, prefix = '৳') {
  const val = Number(amount || 0);
  return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceExpensesView() {
  const authUser = useSelector((state: any) => state.auth?.user);
  const userRole = (authUser?.role || '').toUpperCase();
  // Admin permissions check: Super Admin, Store Owner, Merchant Admin, Admin
  const isAdmin =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'STORE_OWNER' ||
    userRole === 'MERCHANT_ADMIN' ||
    userRole === 'ADMIN' ||
    userRole.includes('ADMIN') ||
    userRole.includes('OWNER') ||
    !authUser?.role; // Default fallback for dev/owner

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Default to Current Month & Year
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [sourceType, setSourceType] = useState<string>('');
  const [categoryCode, setCategoryCode] = useState('');
  const [accountId, setAccountId] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailExpense, setSelectedDetailExpense] = useState<FinanceTransaction | null>(null);
  const [editingExpense, setEditingExpense] = useState<FinanceTransaction | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<FinanceTransaction | null>(null);

  // Helper to detect if a record is from a past month
  const isPastMonthRecord = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return (
      d.getFullYear() < currentYear ||
      (d.getFullYear() === currentYear && d.getMonth() < currentMonth - 1)
    );
  };

  // Compute date range if month is selected
  let computedStartDate = startDate;
  let computedEndDate = endDate;
  if (selectedMonth > 0 && !startDate && !endDate) {
    computedStartDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
    computedEndDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
  }

  const { data, isLoading, isFetching, refetch } = useGetExpensesQuery({
    categoryCode: categoryCode || undefined,
    accountId: accountId || undefined,
    sourceType: (sourceType as any) || undefined,
    search: search ? search.trim() : undefined,
    startDate: computedStartDate || undefined,
    endDate: computedEndDate || undefined,
    page,
    limit,
  });

  const [exportTransactions, { isLoading: isExporting }] = useExportFinanceTransactionsMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const { data: accountsData } = useGetAccountsQuery();
  const rawAccounts = (accountsData as any)?.data !== undefined ? (accountsData as any).data : accountsData;
  const accounts: FinanceAccount[] = Array.isArray(rawAccounts)
    ? rawAccounts
    : (rawAccounts as any)?.items || [];

  const rawData = (data as any)?.data !== undefined ? (data as any).data : data;
  const expenseList: FinanceTransaction[] = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData)
    ? rawData
    : [];
  const totalCount = Number(rawData?.total || expenseList.length || 0);
  const summary = rawData?.summary;
  const breakdown = summary?.categoryBreakdown || {};
  const totalPages = Math.max(1, Math.ceil(totalCount / limit) || rawData?.totalPages || 1);

  // Check active filter count
  const activeFiltersCount = [
    Boolean(selectedMonth !== currentMonth || selectedYear !== currentYear),
    Boolean(sourceType),
    Boolean(categoryCode),
    Boolean(accountId),
    Boolean(search),
    Boolean(startDate),
    Boolean(endDate),
  ].filter(Boolean).length;

  const handleResetAllFilters = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setSourceType('');
    setCategoryCode('');
    setAccountId('');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportCsv = async () => {
    try {
      const res = await exportTransactions({
        year: selectedYear,
        month: selectedMonth === 0 ? undefined : selectedMonth,
        type: 'EXPENSE',
        categoryCode: categoryCode || undefined,
      }).unwrap();

      if (res?.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename || `finance_expenses_${selectedYear}_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to export CSV.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    try {
      await deleteExpense(deletingExpense.id).unwrap();
      toast.success(`Expense ${deletingExpense.transactionNumber} deleted successfully.`);
      setDeletingExpense(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete expense.');
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'PAYROLL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-pink-50 text-pink-700 border border-pink-200">
            [Payroll]
          </span>
        );
      case 'BILL':
      case 'PURCHASE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            [Purchase Bill]
          </span>
        );
      case 'ORDER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            [Order Shipping]
          </span>
        );
      case 'HR_EXPENSE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            [HR Claim]
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
            [Manual Entry]
          </span>
        );
    }
  };

  // Helper to generate numbered pagination pages
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expenses Ledger</h1>
            {selectedMonth > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span>
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  {selectedMonth === currentMonth && selectedYear === currentYear ? ' (Current Month)' : ''}
                </span>
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {totalCount} Total Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Operational expenditures, COGS, staff payroll, shipping freight, and facilities overhead • Click any row for details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month & Year Filter Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value={0}>All Months ({selectedYear})</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m} {idx + 1 === currentMonth ? '⭐ (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Record Expense Button */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Summary Stream Cards (Clickable Quick Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setCategoryCode('');
            setPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer ${
            !categoryCode ? 'border-rose-300 ring-2 ring-rose-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Expenses</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                {formatMoney(summary?.totalExpense || 0)}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setCategoryCode(categoryCode === 'SALARY' ? '' : 'SALARY');
            setPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer ${
            categoryCode === 'SALARY' ? 'border-pink-400 ring-2 ring-pink-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Salaries & Payroll</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                {formatMoney(breakdown.SALARY || 0)}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setCategoryCode(categoryCode === 'COGS' ? '' : 'COGS');
            setPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer ${
            categoryCode === 'COGS' ? 'border-amber-400 ring-2 ring-amber-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">COGS & Inventory</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                {formatMoney(breakdown.COGS || 0)}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setCategoryCode(categoryCode === 'MARKETING' ? '' : 'MARKETING');
            setPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer ${
            categoryCode === 'MARKETING' ? 'border-orange-400 ring-2 ring-orange-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Marketing & Ads</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                {formatMoney(breakdown.MARKETING || 0)}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setCategoryCode(categoryCode === 'RENT' ? '' : 'RENT');
            setPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer ${
            categoryCode === 'RENT' ? 'border-teal-400 ring-2 ring-teal-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rent & Utilities</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                {formatMoney(Number(breakdown.RENT || 0) + Number(breakdown.UTILITIES || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search description, reference, voucher #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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

          {/* Source Filter */}
          <div className="lg:col-span-2">
            <select
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
            >
              <option value="">All Sources</option>
              <option value="PAYROLL">Payroll [PAYROLL]</option>
              <option value="BILL">Supplier Bills [BILL]</option>
              <option value="ORDER">Order Shipping [ORDER]</option>
              <option value="MANUAL">Manual Entry [MANUAL]</option>
              <option value="HR_EXPENSE">HR Claim [HR]</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-2">
            <select
              value={categoryCode}
              onChange={(e) => {
                setCategoryCode(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="COGS">COGS (Product Cost)</option>
              <option value="SALARY">Salaries & Payroll</option>
              <option value="SHIPPING">Courier & Shipping</option>
              <option value="MARKETING">Marketing & Ads</option>
              <option value="RENT">Office & Shop Rent</option>
              <option value="UTILITIES">Utilities & Power</option>
              <option value="EQUIPMENT">Equipment & Racks</option>
              <option value="PACKAGING">Packaging Boxes</option>
              <option value="SOFTWARE">Software & Cloud</option>
              <option value="OFFICE_ADMIN">Office Administration</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other Expenses</option>
            </select>
          </div>

          {/* Account Filter */}
          <div className="lg:col-span-2">
            <select
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
            >
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Limit / Page Size */}
          <div className="lg:col-span-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Date Range Sub-Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="text-slate-500 hover:text-rose-600 font-medium underline text-xs cursor-pointer"
              >
                Clear Dates
              </button>
            )}
          </div>

          {/* Active Filters / Reset */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                {activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'}
              </span>
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs border border-rose-200 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
                Reset To Current Month
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs animate-pulse flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <p className="font-semibold">Loading expense records...</p>
          </div>
        ) : expenseList.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No expense records found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                No matching transactions found for the selected month or filter criteria.
              </p>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Reset To Current Month
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Txn #</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Account</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Recorded By</th>
                  <th className="px-5 py-3.5 text-right">Amount (BDT)</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseList.map((t) => {
                  const isPast = isPastMonthRecord(t.transactionDate);
                  const canEdit = !isPast || isAdmin;

                  const creatorName =
                    t.createdByUser?.fullName || t.createdByUser?.email || 'System / Auto';
                  const creatorId =
                    t.createdByUser?.id || t.createdByUserId || 'SYS';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedDetailExpense(t)}
                      className="hover:bg-rose-50/40 transition cursor-pointer group"
                      title="Click row to view full details"
                    >
                      <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                        {String(t.transactionDate || '').split('T')[0]}
                        {isPast && (
                          <span className="ml-1.5 inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Past Month
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap group-hover:text-rose-600 transition-colors">
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
                        {getSourceBadge(t.sourceType || 'MANUAL')}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
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

                      {/* Recorded By Column (User Name and ID) */}
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

                      <td className="px-5 py-3.5 font-black text-right text-rose-600 whitespace-nowrap">
                        {formatMoney(t.amount, '-৳')}
                      </td>

                      {/* Actions: View Details, Edit & Delete */}
                      <td
                        className="px-4 py-3.5 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailExpense(t)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingExpense(t)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title={isPast ? 'Edit Past Month Expense (Admin Access)' : 'Edit Expense'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingExpense(t)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title={isPast ? 'Delete Past Month Expense (Admin Access)' : 'Delete Expense'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[10px] font-semibold cursor-not-allowed"
                              title="Only administrators can edit or delete expenses from previous months."
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Enhanced Pagination Controls */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="font-medium text-slate-600">
            Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
            <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
            <span className="font-bold text-slate-900">{totalCount}</span> expense records
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numbered Page Buttons */}
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
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
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

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        isOpen={Boolean(selectedDetailExpense)}
        onClose={() => setSelectedDetailExpense(null)}
        expense={selectedDetailExpense}
        isAdmin={isAdmin}
        onEdit={(exp) => {
          setSelectedDetailExpense(null);
          setEditingExpense(exp);
        }}
        onDelete={(exp) => {
          setSelectedDetailExpense(null);
          setDeletingExpense(exp);
        }}
      />

      {/* Create Expense Modal */}
      <CreateExpenseModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        title="Delete Expense Record"
        subtitle="Permanent ledger removal"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        size="md"
      >
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure you want to delete this expense?</p>
              <p className="mt-1">
                Transaction <span className="font-mono font-bold">{deletingExpense?.transactionNumber}</span> for{' '}
                <span className="font-bold">{formatMoney(deletingExpense?.amount || 0)}</span> will be permanently removed, and the paid amount will be refunded/restored back to the account balance.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeletingExpense(null)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
