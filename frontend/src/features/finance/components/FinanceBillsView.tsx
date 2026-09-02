'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Receipt,
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
  useGetBillsQuery,
  useDeleteBillMutation,
  FinanceBill,
  FinanceBillStatus,
} from '../api/financeApi';
import { CreateBillModal } from './CreateBillModal';
import { BillDetailModal } from './BillDetailModal';
import { RecordBillPaymentModal } from './RecordBillPaymentModal';

const STATUS_BADGE: Record<FinanceBillStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', icon: <Clock className="w-3 h-3" /> },
  UNPAID: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <AlertCircle className="w-3 h-3" /> },
  PARTIALLY_PAID: { bg: 'bg-sky-100', text: 'text-sky-800', icon: <Clock className="w-3 h-3" /> },
  PAID: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
  OVERDUE: { bg: 'bg-rose-100', text: 'text-rose-800', icon: <AlertCircle className="w-3 h-3" /> },
  VOID: { bg: 'bg-slate-200', text: 'text-slate-500', icon: <AlertCircle className="w-3 h-3" /> },
};

export function FinanceBillsView() {
  const [status, setStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<FinanceBill | null>(null);
  const [paymentBill, setPaymentBill] = useState<FinanceBill | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetBillsQuery({
    status: status || undefined,
    category: category || undefined,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 20,
  });

  const [deleteBill, { isLoading: isDeletingBill }] = useDeleteBillMutation();
  const [billIdPendingDelete, setBillIdPendingDelete] = useState<string | null>(null);

  const bills = data?.items || [];
  const summary = data?.summary;
  const totalPages = data?.totalPages || 1;

  const handleDelete = (id: string) => {
    setBillIdPendingDelete(id);
  };

  const confirmDelete = async () => {
    if (!billIdPendingDelete) return;
    try {
      await deleteBill(billIdPendingDelete).unwrap();
      toast.success('Bill deleted.');
      setBillIdPendingDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete bill.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supplier Bills</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage vendor invoices, procurement expenses, and accounts payable
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Record Bill
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            ৳{Number(summary?.totalBilled || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Paid</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            ৳{Number(summary?.totalPaid || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Payables</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            ৳{Number(summary?.totalUnpaid || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overdue Payables</span>
          <p className="text-xl font-black text-rose-600 mt-1">
            ৳{Number(summary?.totalOverdue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search bill # or vendor..."
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
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
          >
            <option value="">All Categories</option>
            <option value="COGS">COGS</option>
            <option value="MARKETING">Marketing</option>
            <option value="SHIPPING">Shipping</option>
            <option value="RENT">Rent</option>
            <option value="UTILITIES">Utilities</option>
            <option value="SOFTWARE">Software</option>
            <option value="OTHER">Other</option>
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

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading supplier bills...
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No bills found. Click &quot;Record Bill&quot; to log a vendor bill.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Bill #</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Bill Date</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Total</th>
                  <th className="px-5 py-3.5 text-right">Balance Due</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => {
                  const statusMeta = STATUS_BADGE[bill.status] || STATUS_BADGE.UNPAID;

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-amber-600">
                        #{bill.billNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold text-slate-900">{bill.supplierName}</p>
                        {bill.supplierContact && (
                          <p className="text-[11px] text-slate-500">{bill.supplierContact}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {bill.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{bill.issueDate}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{bill.dueDate}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          {statusMeta.icon}
                          {bill.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-semibold text-right text-slate-900">
                        ৳{Number(bill.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`px-5 py-3.5 text-xs font-mono font-bold text-right ${
                          Number(bill.balanceDue) > 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        ৳{Number(bill.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBill(bill)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Bill"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {bill.status !== 'PAID' && bill.status !== 'VOID' && (
                            <button
                              type="button"
                              onClick={() => setPaymentBill(bill)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Pay Bill"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(bill.id)}
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

      <CreateBillModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <BillDetailModal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        bill={selectedBill}
        onPayBill={(b) => {
          setSelectedBill(null);
          setPaymentBill(b);
        }}
      />
      <RecordBillPaymentModal
        isOpen={!!paymentBill}
        onClose={() => setPaymentBill(null)}
        bill={paymentBill}
      />

      <ConfirmDialog
        isOpen={billIdPendingDelete !== null}
        onClose={() => setBillIdPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Bill"
        message="Are you sure you want to delete this bill?"
        confirmLabel="Delete"
        isLoading={isDeletingBill}
      />
    </div>
  );
}
