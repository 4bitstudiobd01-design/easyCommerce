'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  FileText,
  MoreVertical,
  Download,
  Copy,
  Mail,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { TransactionRecord } from '../types';
import { TransactionOverviewCard } from './TransactionOverviewCard';
import { TransactionDetailsTabs } from './TransactionDetailsTabs';
import { TransactionAmountBreakdownCard } from './TransactionAmountBreakdownCard';
import { TransactionTimelineCard } from './TransactionTimelineCard';
import { TransactionSupportCard } from './TransactionSupportCard';
import { toast } from 'sonner';

interface TransactionDetailsViewProps {
  transaction: TransactionRecord;
  onBack: () => void;
  onRefund?: (txn: TransactionRecord) => void;
}

export function TransactionDetailsView({
  transaction,
  onBack,
  onRefund,
}: TransactionDetailsViewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const handleViewReceipt = () => {
    toast.info(`Opening receipt for ${transaction.id}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Breadcrumbs */}
      <div className="space-y-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-emerald-700 transition-colors cursor-pointer"
          >
            Transactions
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Transaction Details</span>
        </nav>

        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Transaction Details
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  transaction.status === 'Success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : transaction.status === 'Refunded'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : transaction.status === 'Failed'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {transaction.status}
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-1">
              Detailed information about this transaction.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 relative">
            {/* Refund Button */}
            {transaction.status === 'Success' && !transaction.isNegative && (
              <button
                type="button"
                onClick={() => onRefund?.(transaction)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refund</span>
              </button>
            )}

            {/* View Receipt Button */}
            <button
              type="button"
              onClick={handleViewReceipt}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>View Receipt</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <span>More Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleCopy(transaction.id, 'Transaction ID');
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Transaction ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        toast.success(`PDF receipt exported for ${transaction.id}`);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Download Receipt (PDF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        toast.success(`Resent invoice to ${transaction.customer?.email || 'customer'}`);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Resend Email Receipt</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Increased width: 8.5/9 cols out of 12) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <TransactionOverviewCard transaction={transaction} />
          <TransactionDetailsTabs transaction={transaction} />
        </div>

        {/* Right Column (Decreased width: 3.5/3 cols out of 12) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <TransactionAmountBreakdownCard transaction={transaction} />
          <TransactionTimelineCard transaction={transaction} />
          <TransactionSupportCard transactionId={transaction.id} />
        </div>
      </div>

      {/* 3. Bottom Back Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Back to Transactions</span>
        </button>
      </div>
    </div>
  );
}
