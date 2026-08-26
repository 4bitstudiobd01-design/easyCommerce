'use client';

import React from 'react';
import { TransactionRecord } from '../types';

interface PaymentInformationCardProps {
  transaction: TransactionRecord;
}

export function PaymentInformationCard({
  transaction,
}: PaymentInformationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5 text-xs">
      <h3 className="font-bold text-slate-900 tracking-tight text-xs sm:text-[13px]">
        Payment Information
      </h3>

      <div className="space-y-3">
        {/* Billing Email */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Billing Email</span>
          <span className="font-medium text-slate-800 truncate">
            {transaction.billingEmail || 'rahim.hossain@email.com'}
          </span>
        </div>

        {/* Billing Name */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Billing Name</span>
          <span className="font-bold text-slate-900">
            {transaction.billingName || 'Rahim Hossain'}
          </span>
        </div>

        {/* Card Holder */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Card Holder</span>
          <span className="font-bold text-slate-900">
            {transaction.cardHolder || 'Rahim Hossain'}
          </span>
        </div>

        {/* Card Brand */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Card Brand</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <span className="text-[#1A1F71] font-black italic tracking-tighter text-[10px] bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
              VISA
            </span>
            <span>{transaction.cardBrand || 'Visa'}</span>
          </div>
        </div>

        {/* Card Last 4 */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Card Last 4</span>
          <span className="font-mono font-bold text-slate-800">
            {transaction.cardLast4 || '4242'}
          </span>
        </div>

        {/* Card Expiry */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Card Expiry</span>
          <span className="font-medium text-slate-800">
            {transaction.cardExpiry || '12 / 2028'}
          </span>
        </div>

        {/* Country */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Country</span>
          <span className="font-medium text-slate-800">
            {transaction.country || 'Bangladesh'}
          </span>
        </div>

        {/* IP Address */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">IP Address</span>
          <span className="font-mono text-slate-600 text-[11px]">
            {transaction.ipAddress || '103.86.XXX.XXX'}
          </span>
        </div>

        {/* Device */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Device</span>
          <span className="font-medium text-slate-700">
            {transaction.device || 'Chrome on macOS'}
          </span>
        </div>

        {/* Risk Level */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <span className="text-slate-500 font-medium">Risk Level</span>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-2 py-0.5 rounded-full text-[10px]">
            {transaction.riskLevel || 'Low'}
          </span>
        </div>
      </div>
    </div>
  );
}
