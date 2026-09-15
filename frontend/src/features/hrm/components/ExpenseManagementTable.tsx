'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Receipt,
  ReceiptText,
  Plus,
  RefreshCw,
  Check,
  X,
  Trash2,
  Banknote,
  Paperclip,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import {
  Expense,
  ExpenseStatus,
  useGetExpensesQuery,
  useReviewExpenseMutation,
  useReimburseExpenseMutation,
  useDeleteExpenseMutation,
  openExpenseReceipt,
} from '../api/hrmApi';
import { CreateExpenseModal } from './CreateExpenseModal';

const STATUS_BADGE: Record<ExpenseStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-sky-100 text-sky-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  REIMBURSED: 'bg-emerald-100 text-emerald-800',
};

function formatAmount(amount: string, currency: string) {
  const value = Number(amount);
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function categoryLabel(category: string) {
  return category.replace('_', ' ').replace(/\w\S*/g, (t) => t.charAt(0) + t.slice(1).toLowerCase());
}

export function ExpenseManagementTable() {
  const [status, setStatus] = useState<ExpenseStatus | ''>('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [rejecting, setRejecting] = useState<Expense | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetExpensesQuery({
    status: status || undefined,
    page,
    limit: 20,
  });
  const [reviewExpense, { isLoading: isReviewing }] = useReviewExpenseMutation();
  const [reimburseExpense] = useReimburseExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const expenses = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.limit ?? 20)));

  const handleApprove = async (id: string) => {
    try {
      await reviewExpense({ id, status: 'APPROVED' }).unwrap();
      toast.success('Expense approved.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to approve expense.');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejecting) return;
    try {
      await reviewExpense({ id: rejecting.id, status: 'REJECTED', reviewNote: rejectNote || undefined }).unwrap();
      toast.success('Expense rejected.');
      setRejecting(null);
      setRejectNote('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reject expense.');
    }
  };

  const handleReimburse = async (id: string) => {
    try {
      await reimburseExpense(id).unwrap();
      toast.success('Expense marked as reimbursed.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to mark as reimbursed.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      await deleteExpense(deleting.id).unwrap();
      toast.success('Expense deleted.');
      setDeleting(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete expense.');
    }
  };

  const handleViewReceipt = async (id: string) => {
    try {
      await openExpenseReceipt(id);
    } catch {
      toast.error('Could not load the attached receipt.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-lime-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Expenses
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
                {total}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Employee expense claims and reimbursements</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            New Expense
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-2">
        {(['', 'PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED'] as (ExpenseStatus | '')[]).map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => {
              setPage(1);
              setStatus(s);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
              status === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <ReceiptText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No expense claims found.</p>
                    <p className="text-xs text-slate-500 mt-1">Click "New Expense" to file one.</p>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 text-white font-extrabold text-sm rounded-full flex items-center justify-center uppercase shrink-0 shadow-sm">
                          {expense.employee?.fullName?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{expense.employee?.fullName ?? 'Unknown'}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{expense.employee?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-slate-50 text-slate-700 border-slate-200">
                        {categoryLabel(expense.category)}
                        {expense.receiptFileId && <Paperclip className="w-3 h-3" />}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 font-mono">{formatAmount(expense.amount, expense.currency)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[expense.status]}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {expense.receiptFileId && (
                          <button
                            onClick={() => handleViewReceipt(expense.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View receipt"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        )}
                        {expense.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(expense.id)}
                              disabled={isReviewing}
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejecting(expense)}
                              className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleting(expense)}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {expense.status === 'APPROVED' && (
                          <button
                            onClick={() => handleReimburse(expense.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition"
                            title="Mark as reimbursed"
                          >
                            <Banknote className="w-3.5 h-3.5" /> Reimburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page <span className="font-bold text-slate-700">{page}</span> of{' '}
              <span className="font-bold text-slate-700">{totalPages}</span> · {total} total claims
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateExpenseModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject Expense?"
        icon={<X className="w-5 h-5 text-rose-600" />}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setRejecting(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={isReviewing}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
            >
              {isReviewing ? 'Rejecting...' : 'Reject Claim'}
            </button>
          </>
        }
      >
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600">
            Rejecting <strong>{rejecting?.employee?.fullName}</strong>'s {rejecting && categoryLabel(rejecting.category).toLowerCase()}{' '}
            expense claim.
          </p>
          <textarea
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            rows={2}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Reason for rejection (optional)"
          />
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Expense Claim?"
        icon={<Trash2 className="w-5 h-5 text-rose-600" />}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleting(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </>
        }
      >
        <div className="p-6 text-sm text-slate-600">
          Are you sure you want to delete this <strong>{deleting && formatAmount(deleting.amount, deleting.currency)}</strong> claim?
        </div>
      </Modal>
    </div>
  );
}
