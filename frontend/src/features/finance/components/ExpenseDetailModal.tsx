'use client';

import React, { useState } from 'react';
import {
  TrendingDown,
  Calendar,
  Wallet,
  CreditCard,
  Tag,
  FileText,
  User,
  Clock,
  Hash,
  ShieldCheck,
  Edit,
  Trash2,
  Lock,
  Paperclip,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FinanceTransaction } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expense: FinanceTransaction | null;
  isAdmin?: boolean;
  onEdit?: (expense: FinanceTransaction) => void;
  onDelete?: (expense: FinanceTransaction) => void;
}

export function ExpenseDetailModal({
  isOpen,
  onClose,
  expense,
  isAdmin = false,
  onEdit,
  onDelete,
}: Props) {
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!isOpen || !expense) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const isPast = (() => {
    if (!expense.transactionDate) return false;
    const d = new Date(expense.transactionDate);
    return (
      d.getFullYear() < currentYear ||
      (d.getFullYear() === currentYear && d.getMonth() < currentMonth - 1)
    );
  })();

  const canModify = !isPast || isAdmin;

  const creatorName =
    expense.createdByUser?.fullName || expense.createdByUser?.email || 'System / Auto Generated';
  const creatorEmail = expense.createdByUser?.email || 'system@bitcommerce.internal';
  const creatorId = expense.createdByUser?.id || expense.createdByUserId || 'SYSTEM-AUTOMATION';

  const formatAmount = (val: number | string) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const receipt = expense.receiptFile;
  const isImageReceipt =
    receipt?.mimeType?.startsWith('image/') ||
    (receipt?.url && receipt.url.match(/\.(jpeg|jpg|png|webp|gif)$/i));
  const isPdfReceipt =
    receipt?.mimeType?.includes('pdf') ||
    (receipt?.url && receipt.url.match(/\.pdf$/i));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Expense Voucher #${expense.transactionNumber}`}
      subtitle={`Recorded on ${String(expense.transactionDate || '').split('T')[0]} • ${expense.category?.name || expense.categoryCode || 'General Expense'}`}
      icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
      size="lg"
    >
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Status & Source Tags Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              EXPENSE
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {expense.status || 'COMPLETED'}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200 uppercase">
              {expense.sourceType || 'MANUAL'}
            </span>
            {receipt && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Paperclip className="w-3 h-3 text-blue-600" />
                Voucher Attached
              </span>
            )}
          </div>

          {isPast && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              Past Month Record
            </span>
          )}
        </div>

        {/* Top Highlight Card: Amount & Payment Source */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase font-bold text-rose-100 tracking-wider">
              Total Expenditure (Paid)
            </p>
            <p className="text-3xl font-black mt-1 tracking-tight">
              -{formatAmount(expense.amount)}
            </p>
            <p className="text-xs text-rose-100 font-medium mt-1">
              Method: <span className="font-bold text-white uppercase">{expense.paymentMethod || 'CASH'}</span>
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-sm border border-white/20 p-3.5 rounded-xl text-right sm:text-left min-w-[180px]">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-100">
              Paid From Account
            </p>
            <p className="text-sm font-black text-white mt-0.5">
              {expense.account?.name || 'Cash on Hand'}
            </p>
            <p className="text-[11px] text-rose-100 font-mono">
              {expense.account?.bankOrProviderName ? `${expense.account.bankOrProviderName}` : 'Internal Register'}
            </p>
          </div>
        </div>

        {/* Creator / Added By Information Box */}
        <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Expense Creator & Audit Trail
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Audit ID Verified
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
              {creatorName[0].toUpperCase()}
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-slate-900 truncate">{creatorName}</p>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Submitter
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">{creatorEmail}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-[11px] text-slate-600">
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                  User ID: <span className="font-bold text-slate-900">{creatorId}</span>
                </span>
                {expense.createdAt && (
                  <span className="text-slate-400">
                    Logged: {new Date(expense.createdAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expense Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Category
            </span>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-900">
                {expense.category?.name || expense.categoryCode?.replace(/_/g, ' ') || 'General'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Expense Date
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-900">
                {String(expense.transactionDate || '').split('T')[0]}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Reference / Voucher #
            </span>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-900 font-mono">
                {expense.reference || 'None (Internal)'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Source Stream
            </span>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-900">
                {expense.sourceType === 'PAYROLL'
                  ? 'HRM Salary Payroll Run'
                  : expense.sourceType === 'BILL'
                  ? 'Supplier Purchase Bill'
                  : expense.sourceType === 'ORDER'
                  ? 'Order Logistics Freight'
                  : 'Manual Business Expense'}
              </span>
            </div>
          </div>
        </div>

        {/* Description / Reason */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Expense Description & Purpose
          </span>
          <p className="text-xs font-medium text-slate-800 leading-relaxed">
            {expense.description || 'No detailed notes provided for this transaction.'}
          </p>
        </div>

        {/* Attached Voucher / Receipt File (Image or PDF) */}
        {receipt && receipt.url && (
          <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                Attached Receipt Voucher / Supporting Document
              </span>
              <a
                href={receipt.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {isImageReceipt ? (
              <div className="space-y-2">
                <div
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                  className="relative group rounded-xl overflow-hidden border border-blue-200 bg-white cursor-pointer"
                >
                  <img
                    src={receipt.url}
                    alt="Receipt Voucher"
                    className={`w-full object-contain bg-slate-100 transition-all ${
                      isImageZoomed ? 'max-h-[500px]' : 'max-h-60'
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-bold">
                    <Eye className="w-4 h-4" />
                    <span>{isImageZoomed ? 'Click to Shrink' : 'Click to Expand'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-blue-800 font-mono text-center">
                  {receipt.fileName || 'voucher_image.jpg'}
                </p>
              </div>
            ) : isPdfReceipt ? (
              <div className="p-4 rounded-xl bg-white border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {receipt.fileName || 'Expense_Receipt_Document.pdf'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">PDF Attachment Document</p>
                  </div>
                </div>

                <a
                  href={receipt.url}
                  target="_blank"
                  rel="noreferrer"
                  download={receipt.fileName || 'voucher.pdf'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {receipt.fileName || 'Attached Voucher File'}
                  </span>
                </div>
                <a
                  href={receipt.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Download
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close Details
          </button>

          <div className="flex items-center gap-2">
            {canModify ? (
              <>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEdit(expense);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Expense</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onDelete(expense);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Past Month (Admin Only Modification)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
