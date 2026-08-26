'use client';

import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { TransactionRecord } from '../types';
import { toast } from 'sonner';

interface TransactionOverviewCardProps {
  transaction: TransactionRecord;
}

export function TransactionOverviewCard({
  transaction,
}: TransactionOverviewCardProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const renderGatewayLogo = (gateway: TransactionRecord['gateway']) => {
    switch (gateway) {
      case 'stripe':
        return (
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-[#635BFF] font-extrabold tracking-tighter text-[13px] lowercase">
              stripe
            </span>
            <span className="text-slate-700 text-xs font-semibold">Stripe</span>
          </div>
        );
      case 'sslcommerz':
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-[#00529B] font-extrabold tracking-tight text-[11px] uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              sslcommerz
            </span>
          </div>
        );
      case 'bkash':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#E2136E] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
              ৳
            </div>
            <span className="text-[#E2136E] font-bold text-xs tracking-tight">
              bKash
            </span>
          </div>
        );
      default:
        return (
          <span className="text-xs font-semibold text-slate-700 uppercase">
            {transaction.gatewayDisplayName || gateway}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
        Transaction Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Column 1 */}
        <div className="space-y-3.5">
          {/* Transaction ID */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Transaction ID
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-xs sm:text-[13px]">
                {transaction.id}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(transaction.id, 'Transaction ID')}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Copy ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Gateway */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Gateway
            </span>
            {renderGatewayLogo(transaction.gateway)}
          </div>

          {/* Amount */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Amount
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-[13px]">
              <span>{transaction.amount}</span>
              <span className="text-[11px] text-slate-500 font-normal">BDT</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Status
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{transaction.status}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Description
            </span>
            <span className="text-slate-700 font-medium leading-relaxed block">
              {transaction.description || 'Subscription payment for Growth Plan (Monthly)'}
            </span>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-3.5">
          {/* Transaction Type */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Transaction Type
            </span>
            <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold px-2.5 py-0.5 rounded-lg">
              {transaction.type}
            </span>
          </div>

          {/* Gateway Transaction ID */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Gateway Transaction ID
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-800 text-[11px] font-semibold">
                {transaction.gatewayTransactionId || 'pi_3M7tZtL2e2eXrY1o2C'}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    transaction.gatewayTransactionId || 'pi_3M7tZtL2e2eXrY1o2C',
                    'Gateway Transaction ID'
                  )
                }
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Copy ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Currency */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Currency
            </span>
            <span className="font-semibold text-slate-800">
              {transaction.currencyLabel || 'BDT (Bangladeshi Taka)'}
            </span>
          </div>

          {/* Payment Method */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Payment Method
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <span className="text-[#1A1F71] font-black italic tracking-tighter text-[11px] bg-blue-50 px-1 py-0.5 rounded border border-blue-200 select-none">
                VISA
              </span>
              <span>Visa •••• 4242</span>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Metadata
            </span>
            <span className="text-slate-700 font-medium block">
              {transaction.metadata || 'Plan: Growth Plan (Monthly)'}
            </span>
          </div>
        </div>

        {/* Column 3 */}
        <div className="space-y-3.5">
          {/* Merchant */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Merchant
            </span>
            <a
              href={`/admin/merchants`}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{transaction.merchant.name}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Store */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Store
            </span>
            <a
              href={`https://${transaction.merchant.domain}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{transaction.merchant.domain}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Customer */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Customer
            </span>
            <a
              href={`mailto:${transaction.customer?.email || 'rahim.hossain@email.com'}`}
              className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{transaction.customer?.email || 'rahim.hossain@email.com'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Related Order */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Related Order
            </span>
            <a
              href={`/admin/orders`}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{transaction.relatedOrder || 'ORD-2026-0005123'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Subscription */}
          <div>
            <span className="text-slate-500 font-medium block mb-1">
              Subscription
            </span>
            <a
              href={`/admin/subscriptions`}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{transaction.subscription || 'SUB-2026-000312'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
