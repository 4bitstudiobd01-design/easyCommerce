'use client';

import React, { useState } from 'react';
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

const STATUS_BADGE: Record<FinanceInvoiceStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', icon: <Clock className="w-3 h-3" /> },
  UNPAID: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <AlertCircle className="w-3 h-3" /> },
  PARTIALLY_PAID: { bg: 'bg-sky-100', text: 'text-sky-800', icon: <Clock className="w-3 h-3" /> },
  PAID: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
  OVERDUE: { bg: 'bg-rose-100', text: 'text-rose-800', icon: <AlertCircle className="w-3 h-3" /> },
  VOID: { bg: 'bg-slate-200', text: 'text-slate-500', icon: <AlertCircle className="w-3 h-3" /> },
};

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
            Create Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoiced</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            ৳{Number(summary?.totalInvoiced || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Collected</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            ৳{Number(summary?.totalPaid || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Receivables</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            ৳{Number(summary?.totalUnpaid || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overdue Balance</span>
          <p className="text-xl font-black text-rose-600 mt-1">
            ৳{Number(summary?.totalOverdue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
          />
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
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
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
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
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No invoices found. Click &quot;Create Invoice&quot; to issue your first invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Total</th>
                  <th className="px-5 py-3.5 text-right">Balance Due</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const statusMeta = STATUS_BADGE[inv.status] || STATUS_BADGE.UNPAID;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-blue-600">
                        #{inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold text-slate-900">{inv.customerName}</p>
                        {inv.customerPhone && (
                          <p className="text-[11px] text-slate-500">{inv.customerPhone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{inv.issueDate}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{inv.dueDate}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          {statusMeta.icon}
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-semibold text-right text-slate-900">
                        ৳{Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`px-5 py-3.5 text-xs font-mono font-bold text-right ${
                          Number(inv.balanceDue) > 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        ৳{Number(inv.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                            <button
                              type="button"
                              onClick={() => setPaymentInvoice(inv)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Record Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
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
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
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
