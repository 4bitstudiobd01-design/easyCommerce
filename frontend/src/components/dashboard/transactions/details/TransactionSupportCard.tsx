'use client';

import React from 'react';
import { ShieldCheck, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionSupportCardProps {
  transactionId: string;
}

export function TransactionSupportCard({
  transactionId,
}: TransactionSupportCardProps) {
  return (
    <div className="bg-[#F0FDF4] border border-emerald-100/90 rounded-2xl p-5 shadow-xs space-y-3.5 text-xs">
      <div className="flex items-center gap-2 text-emerald-900 font-bold">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span className="text-xs sm:text-[13px]">Need help?</span>
      </div>

      <p className="text-slate-600 text-xs leading-relaxed">
        If you&apos;re facing an issue with this transaction, you can raise a support
        ticket for the merchant.
      </p>

      <button
        type="button"
        onClick={() => toast.success(`Support ticket drafted for ${transactionId}`)}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-xs shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        <span>Create Support Ticket</span>
      </button>
    </div>
  );
}
