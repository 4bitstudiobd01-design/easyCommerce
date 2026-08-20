'use client';

import React from 'react';
import { X, Building2, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

interface PayoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PayoutsModal({ isOpen, onClose }: PayoutsModalProps) {
  if (!isOpen) return null;

  const mockPayouts = [
    {
      id: 'PO-2026-091',
      merchant: 'Gadget Hub',
      bank: 'City Bank AC •••• 9012',
      amount: '৳15,000.00',
      status: 'Completed',
      date: 'Aug 13, 2026',
    },
    {
      id: 'PO-2026-090',
      merchant: 'Urban Style Store',
      bank: 'BRAC Bank AC •••• 4421',
      amount: '৳48,500.00',
      status: 'Completed',
      date: 'Aug 10, 2026',
    },
    {
      id: 'PO-2026-089',
      merchant: 'ABC Fashion Store',
      bank: 'Dutch-Bangla Bank AC •••• 1044',
      amount: '৳32,000.00',
      status: 'Processing',
      date: 'Aug 14, 2026',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Merchant Payouts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Settlement history and pending bank transfers
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="space-y-2.5 text-xs">
          {mockPayouts.map((po) => (
            <div
              key={po.id}
              className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {po.merchant}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {po.bank} • {po.date}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-slate-900 block">
                  {po.amount}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                    po.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {po.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
