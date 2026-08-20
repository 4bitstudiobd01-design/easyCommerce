'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { TransactionRecord } from '../types';

interface TransactionAmountBreakdownCardProps {
  transaction: TransactionRecord;
}

export function TransactionAmountBreakdownCard({
  transaction,
}: TransactionAmountBreakdownCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs">
      <h3 className="font-bold text-slate-900 tracking-tight text-xs sm:text-[13px]">
        Amount Breakdown
      </h3>

      <div className="space-y-2.5">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Subtotal</span>
          <span className="font-semibold text-slate-900">
            {transaction.subtotal || transaction.amount}
          </span>
        </div>

        {/* Platform Fee */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Platform Fee (2.50%)</span>
          <span className="font-medium text-slate-600">
            {transaction.platformFee || '- ৳125.00'}
          </span>
        </div>

        {/* Gateway Fee */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Gateway Fee (1.75%)</span>
          <span className="font-medium text-slate-600">
            {transaction.gatewayFee || '- ৳87.50'}
          </span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Tax (0.00%)</span>
          <span className="font-medium text-slate-600">
            {transaction.tax || '৳0.00'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
          <span className="font-bold text-slate-900">Total Amount</span>
          <span className="font-extrabold text-slate-900 text-[13px]">
            {transaction.amount}
          </span>
        </div>

        {/* Net Amount Box */}
        <div className="bg-[#F0FDF4] border border-emerald-100/90 rounded-xl p-3.5 flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
            <span>Net Amount (To Platform)</span>
            <Info className="w-3.5 h-3.5 text-emerald-600 cursor-help" />
          </div>
          <span className="text-emerald-700 font-black text-sm">
            {transaction.netAmountToPlatform || '৳4,787.50'}
          </span>
        </div>
      </div>
    </div>
  );
}
