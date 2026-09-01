'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  useGetInvoicesQuery,
  useDeleteInvoiceMutation,
  useUpdateInvoiceStatusMutation,
  FinanceInvoice,
  FinanceInvoiceStatus,
} from '../api/financeApi';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { RecordInvoicePaymentModal } from './RecordInvoicePaymentModal';

interface StatusOption {
  value: FinanceInvoiceStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'UNPAID', label: 'Unpaid', badgeBg: 'bg-amber-50', badgeText: 'text-amber-800', badgeBorder: 'border-amber-200', dotColor: 'bg-amber-500' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid', badgeBg: 'bg-sky-50', badgeText: 'text-sky-800', badgeBorder: 'border-sky-200', dotColor: 'bg-sky-500' },
  { value: 'PAID', label: 'Paid', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-800', badgeBorder: 'border-emerald-200', dotColor: 'bg-emerald-500' },
  { value: 'OVERDUE', label: 'Overdue', badgeBg: 'bg-rose-50', badgeText: 'text-rose-800', badgeBorder: 'border-rose-200', dotColor: 'bg-rose-500' },
  { value: 'DRAFT', label: 'Draft', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700', badgeBorder: 'border-slate-300', dotColor: 'bg-slate-400' },
  { value: 'VOID', label: 'Void', badgeBg: 'bg-slate-100', badgeText: 'text-slate-500', badgeBorder: 'border-slate-200', dotColor: 'bg-slate-400' },
];

function formatMoney(amount: number | string, prefix = '৳') {
  const val = Number(amount || 0);
  return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InvoiceStatusPicker({
  invoiceId,
  currentStatus,
  onStatusChange,
  disabled,
}: {
  invoiceId: string;
  currentStatus: FinanceInvoiceStatus;
  onStatusChange: (id: string, status: FinanceInvoiceStatus) => Promise<void>;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 176; // w-44 = 176px
      setCoords({
        top: rect.bottom + 6,
        left: Math.max(10, rect.left + rect.width / 2 - dropdownWidth / 2),
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      if (isOpen) {
        updatePosition();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus) || STATUS_OPTIONS[0];

  return (
    <div className="inline-flex items-center justify-center">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-3 py-1 rounded-full border shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${currentOption.badgeBg} ${currentOption.badgeText} ${currentOption.badgeBorder}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${currentOption.dotColor}`} />
        <span>{currentOption.label}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999,
          }}
          className="w-44 bg-white rounded-2xl border border-slate-200 shadow-2xl p-1.5 text-left animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Update Status
          </div>
          <div className="space-y-0.5">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = opt.value === currentStatus;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={async () => {
                    setIsOpen(false);
                    if (opt.value !== currentStatus) {
                      await onStatusChange(invoiceId, opt.value);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FinanceInvoicesView() {
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<FinanceInvoice | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetInvoicesQuery({
    status: status || undefined,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 20,
  });

  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [updateInvoiceStatus, { isLoading: isUpdatingStatus }] = useUpdateInvoiceStatusMutation();

  const invoices = data?.items || [];
  const summary = data?.summary;
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(id).unwrap();
      toast.success('Invoice deleted.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete invoice.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: FinanceInvoiceStatus) => {
    try {
      await updateInvoiceStatus({ id, status: newStatus }).unwrap();
      toast.success(`Invoice status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update invoice status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Invoices</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create, track, and collect customer & client invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatMoney(summary?.totalInvoiced || 0)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatMoney(summary?.totalPaid || 0)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Receivables</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {formatMoney(summary?.totalUnpaid || 0)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue Balance</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatMoney(summary?.totalOverdue || 0)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="DRAFT">Draft</option>
            <option value="VOID">Void</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs animate-pulse flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <p className="font-semibold">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No invoices found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Click &quot;Create Invoice&quot; to issue your first customer invoice.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Total</th>
                  <th className="px-5 py-3.5 text-right">Balance Due</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                        #{inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 text-xs">{inv.customerName}</p>
                        {inv.customerPhone && (
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{inv.customerPhone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">{inv.issueDate}</td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">{inv.dueDate}</td>

                      {/* Middle Aligned Custom Styled Interactive Status Picker */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <InvoiceStatusPicker
                          invoiceId={inv.id}
                          currentStatus={inv.status}
                          onStatusChange={handleStatusChange}
                          disabled={isUpdatingStatus}
                        />
                      </td>

                      <td className="px-5 py-3.5 font-mono font-bold text-right text-slate-900 whitespace-nowrap">
                        {formatMoney(inv.totalAmount)}
                      </td>
                      <td
                        className={`px-5 py-3.5 font-mono font-bold text-right whitespace-nowrap ${
                          Number(inv.balanceDue) > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      >
                        {formatMoney(inv.balanceDue)}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="View Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                            <button
                              type="button"
                              onClick={() => setPaymentInvoice(inv)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Record Payment"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({data?.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateInvoiceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onRecordPayment={(inv) => {
          setSelectedInvoice(null);
          setPaymentInvoice(inv);
        }}
      />
      <RecordInvoicePaymentModal
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        invoice={paymentInvoice}
      />
    </div>
  );
}
