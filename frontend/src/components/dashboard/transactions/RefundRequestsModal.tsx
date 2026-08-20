'use client';

import React from 'react';
import { X, RotateCcw, Check, Ban } from 'lucide-react';
import { toast } from 'sonner';

interface RefundRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RefundRequestsModal({
  isOpen,
  onClose,
}: RefundRequestsModalProps) {
  if (!isOpen) return null;

  const mockRefunds = [
    {
      id: 'REF-REQ-002',
      txnId: 'TXN-2026-0008451',
      merchant: 'Tech Solution',
      amount: '৳2,500.00',
      reason: 'Plan downgrade request within 7 days',
      date: 'Aug 13, 2026',
    },
    {
      id: 'REF-REQ-001',
      merchant: 'FreshShop',
      txnId: 'TXN-2026-0008412',
      amount: '৳750.00',
      reason: 'Duplicate add-on charge',
      date: 'Aug 11, 2026',
    },
  ];

  const handleApprove = (id: string) => {
    toast.success(`Refund request ${id} approved & initiated`);
  };

  const handleReject = (id: string) => {
    toast.info(`Refund request ${id} rejected`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pending Refund Requests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and approve refund requests from merchants
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
        <div className="space-y-3 text-xs">
          {mockRefunds.map((rf) => (
            <div
              key={rf.id}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {rf.merchant}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {rf.txnId} • {rf.date}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-rose-500">
                  {rf.amount}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700">Reason: </span>
                {rf.reason}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleReject(rf.id)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(rf.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Approve Refund
                </button>
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
