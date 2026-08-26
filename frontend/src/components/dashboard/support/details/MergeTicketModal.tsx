'use client';

import React, { useState } from 'react';
import { X, GitMerge } from 'lucide-react';
import { toast } from 'sonner';
import { TicketRecord } from '../types';

interface MergeTicketModalProps {
  ticket: TicketRecord;
  isOpen: boolean;
  onClose: () => void;
  onMerge: (targetCodeId: string) => void;
}

export function MergeTicketModal({
  ticket,
  isOpen,
  onClose,
  onMerge,
}: MergeTicketModalProps) {
  const [targetTicketId, setTargetTicketId] = useState('TKT-2026-000842');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTicketId.trim()) {
      toast.error('Please select a target ticket');
      return;
    }
    onMerge(targetTicketId.trim());
    toast.success(`Merged ${ticket.codeId} into ${targetTicketId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Merge Ticket #{ticket.codeId}
              </h2>
              <p className="text-xs text-slate-500">
                Combine messages and history into a primary ticket.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Destination / Primary Ticket
            </label>
            <select
              value={targetTicketId}
              onChange={(e) => setTargetTicketId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-hidden cursor-pointer"
            >
              <option value="TKT-2026-000842">
                TKT-2026-000842 - Plan downgrade inquiry (Resolved)
              </option>
              <option value="TKT-2026-001247">
                TKT-2026-001247 - Payment failed but amount deducted
              </option>
              <option value="TKT-2026-001246">
                TKT-2026-001246 - Custom domain not working
              </option>
            </select>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
            All messages from <strong>{ticket.codeId}</strong> will be appended to the target ticket, and this ticket will be marked as Closed (Merged).
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Confirm Merge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
