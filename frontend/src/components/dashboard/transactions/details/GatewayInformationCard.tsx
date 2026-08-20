'use client';

import React from 'react';
import { Copy } from 'lucide-react';
import { TransactionRecord } from '../types';
import { toast } from 'sonner';

interface GatewayInformationCardProps {
  transaction: TransactionRecord;
}

export function GatewayInformationCard({
  transaction,
}: GatewayInformationCardProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5 text-xs">
      <h3 className="font-bold text-slate-900 tracking-tight text-xs sm:text-[13px]">
        Gateway Information
      </h3>

      <div className="space-y-3">
        {/* Gateway */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Gateway</span>
          <span className="font-bold text-slate-900 capitalize">
            {transaction.gatewayDisplayName || transaction.gateway}
          </span>
        </div>

        {/* Mode */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Mode</span>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-2 py-0.5 rounded-full text-[10px]">
            {transaction.mode || 'Live'}
          </span>
        </div>

        {/* Gateway Transaction ID */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Gateway Transaction ID</span>
          <div className="flex items-center gap-1">
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
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Payment Intent ID */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Payment Intent ID</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-slate-800 text-[11px] font-semibold">
              {transaction.paymentIntentId || 'pi_3M7tZtL2e2eXrY1o2C'}
            </span>
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  transaction.paymentIntentId || 'pi_3M7tZtL2e2eXrY1o2C',
                  'Payment Intent ID'
                )
              }
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Charge ID */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Charge ID</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-slate-800 text-[11px] font-semibold">
              {transaction.chargeId || 'ch_3M7tZtL2e2eXrY1o2C'}
            </span>
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  transaction.chargeId || 'ch_3M7tZtL2e2eXrY1o2C',
                  'Charge ID'
                )
              }
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Customer ID */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Customer ID</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-slate-800 text-[11px] font-semibold">
              {transaction.customerId || 'cus_M7tZtL2e2eXrY1o2C'}
            </span>
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  transaction.customerId || 'cus_M7tZtL2e2eXrY1o2C',
                  'Customer ID'
                )
              }
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Captured At */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Captured At</span>
          <span className="font-medium text-slate-700">
            {transaction.capturedAt || 'Aug 14, 2026 10:31:27 AM'}
          </span>
        </div>

        {/* Statement Descriptor */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Statement Descriptor</span>
          <span className="font-mono font-semibold text-slate-800">
            {transaction.statementDescriptor || 'EASYCO*URBANSTYLE'}
          </span>
        </div>

        {/* Response Code */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Response Code</span>
          <span className="font-mono font-bold text-slate-900">
            {transaction.responseCode || '200'}
          </span>
        </div>

        {/* AVS Check */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">AVS Check</span>
          <span className="font-bold text-emerald-600">
            {transaction.avsCheck || 'Passed'}
          </span>
        </div>

        {/* 3DS */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <span className="text-slate-500 font-medium">3DS</span>
          <span className="font-medium text-slate-700">
            {transaction.threeDS || 'Not Required'}
          </span>
        </div>
      </div>
    </div>
  );
}
