'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Calendar,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import {
  useGetInvoicesQuery,
  useDeleteInvoiceMutation,
  FinanceInvoice,
  FinanceInvoiceStatus,
} from '../api/financeApi';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { RecordInvoicePaymentModal } from './RecordInvoicePaymentModal';

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', icon: <Clock className="w-3 h-3" /> },
  UNPAID: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: <AlertCircle className="w-3 h-3" /> },
  PARTIALLY_PAID: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800', icon: <Clock className="w-3 h-3" /> },
  PAID: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
  OVERDUE: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', icon: <AlertTriangle className="w-3 h-3 text-rose-600" /> },
  VOID: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-500', icon: <AlertCircle className="w-3 h-3" /> },
};

type PeriodPreset = 'CURRENT_MONTH' | 'PREVIOUS_MONTH' | 'THIS_YEAR' | 'CUSTOM';

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function getPreviousMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function getThisYearRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function formatMoney(amount: number | string | null | undefined): string {
  const val = Number(amount || 0);
  return '৳' + val.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function FinanceInvoicesView() {
  // Date Presets (Default: Current Month)
  const initialMonth = useMemo(() => getCurrentMonthRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('CURRENT_MONTH');
  const [startDate, setStartDate] = useState<string>(initialMonth.startDate);
  const [endDate, setEndDate] = useState<string>(initialMonth.endDate);

  // Status & Filter states
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<FinanceInvoice | null>(null);

  // Query
  const isOutstandingActive = status === 'OUTSTANDING';
  const { data, isLoading, isFetching, refetch } = useGetInvoicesQuery({
    status: status || undefined,
    search: search.trim() || undefined,
    startDate: isOutstandingActive ? undefined : startDate || undefined,
    endDate: isOutstandingActive ? undefined : endDate || undefined,
    page,
    limit,
  });

  const [deleteInvoice] = useDeleteInvoiceMutation();

  const invoices = data?.items || [];
  const summary = data?.summary;
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);

  // Preset Handlers
  const handleSelectPreset = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    setPage(1);
    if (preset === 'CURRENT_MONTH') {
      const range = getCurrentMonthRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    } else if (preset === 'PREVIOUS_MONTH') {
      const range = getPreviousMonthRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    } else if (preset === 'THIS_YEAR') {
      const range = getThisYearRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(id).unwrap();
      toast.success('Invoice deleted.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete invoice.');
    }
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

  const quickFilterChips = [
    { label: 'All Invoices', value: '' },
    {
      label: 'Outstanding Receivables',
      value: 'OUTSTANDING',
      highlight: true,
      badge: summary?.allTimeOutstandingCount ? `${summary.allTimeOutstandingCount}` : undefined,
    },
    { label: 'Unpaid', value: 'UNPAID' },
    { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Overdue', value: 'OVERDUE' },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Invoices</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage sales receivables, record payments, and track customer balances with linked cash flow
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Customer Invoice
          </button>
        </div>
      </div>

      {/* 2. Month & Period Navigation Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Preset Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => handleSelectPreset('CURRENT_MONTH')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodPreset === 'CURRENT_MONTH' && !isOutstandingActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Month
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('PREVIOUS_MONTH')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodPreset === 'PREVIOUS_MONTH' && !isOutstandingActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Previous Month
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('THIS_YEAR')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodPreset === 'THIS_YEAR' && !isOutstandingActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Year
          </button>
          <button
            type="button"
            onClick={() => setPeriodPreset('CUSTOM')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodPreset === 'CUSTOM' && !isOutstandingActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPeriodPreset('CUSTOM');
              setPage(1);
            }}
            disabled={isOutstandingActive}
            className={`px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden ${
              isOutstandingActive ? 'opacity-40 cursor-not-allowed' : 'focus:bg-white focus:border-blue-500'
            }`}
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPeriodPreset('CUSTOM');
              setPage(1);
            }}
            disabled={isOutstandingActive}
            className={`px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden ${
              isOutstandingActive ? 'opacity-40 cursor-not-allowed' : 'focus:bg-white focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      {/* 3. Summary KPI Cards for Active Period */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Invoiced</span>
          <p className="text-lg font-black text-slate-900 mt-1 font-mono">
            {formatMoney(summary?.totalInvoiced)}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            {summary?.totalCount || 0} invoices in period
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Total Collected</span>
          <p className="text-lg font-black text-emerald-700 mt-1 font-mono">
            {formatMoney(summary?.totalPaid)}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">
            {summary?.paidCount || 0} fully settled
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Outstanding Dues</span>
          <p className="text-lg font-black text-amber-700 mt-1 font-mono">
            {formatMoney(summary?.totalUnpaid)}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">
            {summary?.unpaidCount || 0} unpaid invoices
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 bg-sky-50/20 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800">Partially Paid</span>
          <p className="text-lg font-black text-sky-700 mt-1 font-mono">
            {summary?.partiallyPaidCount || 0}
          </p>
          <span className="text-[10px] text-sky-600 font-medium">Partial installments</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">Overdue Invoices</span>
          <p className="text-lg font-black text-rose-600 mt-1 font-mono">
            {formatMoney(summary?.totalOverdue)}
          </p>
          <span className="text-[10px] text-rose-600 font-medium">
            {summary?.overdueCount || 0} past due date
          </span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400">All-Time Outstanding</span>
          <p className="text-lg font-black text-white mt-1 font-mono">
            {formatMoney(summary?.allTimeOutstandingAmount)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Across {summary?.allTimeOutstandingCount || 0} historical invoices
          </span>
        </div>
      </div>

      {/* 4. Quick Filter Chips & Search Bar */}
      <div className="space-y-3">
        {/* Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {quickFilterChips.map((chip) => {
            const isActive = status === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => {
                  setStatus(chip.value);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? chip.highlight
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-900 text-white shadow-xs'
                    : chip.highlight
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{chip.label}</span>
                {chip.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-white text-blue-700' : 'bg-blue-200 text-blue-900'
                    }`}
                  >
                    {chip.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isOutstandingActive && (
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Outstanding Mode Active:</strong> Showing all invoices with remaining receivable &gt; 0 across all historical months (June, July, August, September, etc.). Date filters are bypassed.
            </span>
          </div>
        )}

        {/* Filter Inputs Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search invoice #, customer name, phone, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-semibold">
            <span>{total} invoices found</span>
          </div>
        </div>
      </div>

      {/* 5. Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-bold animate-pulse">
            Loading customer invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No customer invoices found</p>
            <p className="text-slate-400 mt-0.5">
              {isOutstandingActive
                ? 'Great news! No outstanding customer invoices remain unpaid.'
                : 'Try adjusting your date range or filters, or create a new invoice.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Source Order</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid / Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {invoices.map((invoice) => {
                  const statusMeta = STATUS_BADGE[invoice.status] || STATUS_BADGE.UNPAID;
                  const bal = Number(invoice.balanceDue || 0);
                  const paid = Number(invoice.paidAmount || 0);
                  const tot = Number(invoice.totalAmount || 0);
                  const isOverdue = invoice.dueDate < todayStr && bal > 0 && invoice.status !== 'PAID' && invoice.status !== 'VOID';

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(invoice)}
                          className="hover:underline cursor-pointer"
                        >
                          #{invoice.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-black text-slate-900 text-xs">{invoice.customerName}</p>
                        {invoice.customerPhone && (
                          <p className="text-[10px] text-slate-500 font-semibold">{invoice.customerPhone}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {invoice.orderId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <ShoppingCart className="w-3 h-3 text-slate-500" />
                            Order Linked
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">Manual Invoice</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold whitespace-nowrap">
                        {invoice.issueDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {invoice.dueDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          {statusMeta.icon}
                          {invoice.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-xs whitespace-nowrap">
                        {formatMoney(tot)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono text-[11px] leading-tight">
                          <p className="text-emerald-700 font-bold">
                            Paid: {formatMoney(paid)}
                          </p>
                          <p className={`font-black ${bal > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            Due: {formatMoney(bal)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {bal > 0 && invoice.status !== 'VOID' && (
                            <button
                              type="button"
                              onClick={() => setPaymentInvoice(invoice)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition shadow-xs cursor-pointer"
                              title="Record payment against this invoice"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="View Invoice Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(invoice.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Numbered Pagination Toolbar */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
              <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
              <span className="font-bold text-slate-900">{total}</span> invoices
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-[11px] text-slate-400">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
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

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
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
                      key={`inv-page-${pageNum}`}
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

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateInvoiceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <InvoiceDetailModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onRecordPayment={(inv) => {
          setSelectedInvoice(null);
          setPaymentInvoice(inv);
        }}
      />

      <RecordInvoicePaymentModal
        isOpen={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
        invoice={paymentInvoice}
      />
    </div>
  );
}
