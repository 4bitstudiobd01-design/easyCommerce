'use client';

import React from 'react';
import { CreditCard, RotateCcw } from 'lucide-react';

interface TransactionQuickActionsCardProps {
  onOpenPayouts: () => void;
  onOpenRefunds: () => void;
}

export function TransactionQuickActionsCard({
  onOpenPayouts,
  onOpenRefunds,
}: TransactionQuickActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <button
          type="button"
          onClick={onOpenPayouts}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          <span>View Payouts</span>
        </button>

        <button
          type="button"
          onClick={onOpenRefunds}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refund Requests</span>
        </button>
      </div>
    </div>
  );
}
