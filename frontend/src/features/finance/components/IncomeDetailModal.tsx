'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Wallet,
  Landmark,
  Tag,
  FileText,
  User,
  Hash,
  ShieldCheck,
  Edit,
  Trash2,
  Paperclip,
  Download,
  ExternalLink,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FinanceTransaction } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  income: FinanceTransaction | null;
  onEdit?: (income: FinanceTransaction) => void;
  onDelete?: (income: FinanceTransaction) => void;
}

export function IncomeDetailModal({
  isOpen,
  onClose,
  income,
  onEdit,
  onDelete,
}: Props) {
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!isOpen || !income) return null;

  const creatorName =
    income.createdByUser?.fullName || income.createdByUser?.email || 'System / Auto Generated';
  const creatorEmail = income.createdByUser?.email || 'system@bitcommerce.internal';
  const creatorId = income.createdByUser?.id || income.createdByUserId || 'SYSTEM-AUTOMATION';

  const formatAmount = (val: number | string) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const receipt = income.receiptFile;
  const isImageReceipt =
    receipt?.mimeType?.startsWith('image/') ||
    (receipt?.url && receipt.url.match(/\.(jpeg|jpg|png|webp|gif)$/i));
  const isPdfReceipt =
    receipt?.mimeType?.includes('pdf') ||
    (receipt?.url && receipt.url.match(/\.pdf$/i));

  const categoryLabel =
    income.category?.name ||
    (income.categoryCode
      ? income.categoryCode.replace(/_/g, ' ')
      : 'General Revenue');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Income Voucher #${income.transactionNumber}`}
      subtitle={`Recorded on ${String(income.transactionDate || '').split('T')[0]} • ${categoryLabel}`}
      icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Status & Source Tags Bar - using primary (blue) and secondary (slate) colors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              INCOME
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-600" />
              {income.status || 'COMPLETED'}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200 uppercase">
              {income.sourceType || 'MANUAL'}
            </span>
            {receipt && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Paperclip className="w-3 h-3 text-blue-600" />
                Voucher Attached
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Credited to Ledger
          </span>
        </div>

        {/* Top Highlight Card: Primary Brand Gradient (Blue) */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase font-bold text-blue-100 tracking-wider">
              Total Revenue Received
            </p>
            <p className="text-3xl font-black mt-1 tracking-tight text-white">
              +{formatAmount(income.amount)}
            </p>
            <p className="text-xs text-blue-100 font-medium mt-1">
              Method:{' '}
              <span className="font-bold text-white uppercase">
                {income.paymentMethod || 'CASH'}
              </span>
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-xs border border-white/20 p-3.5 rounded-xl text-right sm:text-left min-w-[200px]">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
              Deposited In Account
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Landmark className="w-4 h-4 text-white shrink-0" />
              <p className="text-sm font-black text-white truncate">
                {income.account?.name || 'Cash on Hand'}
              </p>
            </div>
            <p className="text-[11px] text-blue-100 font-mono mt-0.5">
              {income.account?.bankOrProviderName
                ? `${income.account.bankOrProviderName} • ${income.account.type || 'Internal'}`
                : 'Direct Register Account'}
            </p>
          </div>
        </div>

        {/* Creator / Added By Information Box - Secondary Slate container with Primary Blue accents */}
        <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Recorded By & Audit Trail
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Audit ID Verified
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
              {creatorName[0]?.toUpperCase() || 'U'}
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
                  User ID: <span className="font-bold text-slate-900">{creatorId.substring(0, 12)}</span>
                </span>
                {income.createdAt && (
                  <span className="text-slate-400">
                    Logged: {new Date(income.createdAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Income Attributes Grid - Secondary neutral cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Category / Income Stream
            </span>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-900">
                {categoryLabel}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Income Received Date
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-900">
                {String(income.transactionDate || '').split('T')[0]}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Reference / Tracking #
            </span>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-900 font-mono">
                {income.reference || 'None (Direct Inflow)'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Source Stream
            </span>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-900">
                {income.sourceType === 'INVOICE'
                  ? 'Customer Invoice Settlement'
                  : income.sourceType === 'ORDER'
                  ? 'Store Order Payment (COD/Online)'
                  : 'Manual Income Entry'}
              </span>
            </div>
          </div>
        </div>

        {/* Description / Purpose */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Income Description & Purpose
          </span>
          <p className="text-xs font-medium text-slate-800 leading-relaxed">
            {income.description || 'No detailed notes provided for this transaction.'}
          </p>
        </div>

        {/* Attached Voucher / Receipt File (Image or PDF) */}
        {receipt && receipt.url && (
          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                Attached Receipt Voucher / Supporting Document
              </span>
              <a
                href={receipt.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {isImageReceipt ? (
              <div className="space-y-2">
                <div
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white cursor-pointer"
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
                <p className="text-[11px] text-slate-600 font-mono text-center">
                  {receipt.fileName || 'voucher_image.jpg'}
                </p>
              </div>
            ) : isPdfReceipt ? (
              <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {receipt.fileName || 'Income_Receipt_Document.pdf'}
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
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3">
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
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(income);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Income</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(income);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-rose-200 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
