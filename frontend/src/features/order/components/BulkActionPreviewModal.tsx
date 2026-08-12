import React, { useState } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';

interface BulkActionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  actionTitle: string;
  targetStatus: string;
  selectedCount: number;
  isAllMatching: boolean;
  totalMatching?: number;
  isLoading: boolean;
  requireReason?: boolean;
}

export function BulkActionPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  actionTitle,
  targetStatus,
  selectedCount,
  isAllMatching,
  totalMatching,
  isLoading,
  requireReason = false,
}: BulkActionPreviewModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
  };

  const countToProcess = isAllMatching ? (totalMatching || 0) : selectedCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {actionTitle} {countToProcess} Orders?
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600">
            You are about to move {countToProcess} order(s) to <strong className="text-slate-900">{targetStatus}</strong>.
          </p>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm text-blue-800">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="font-bold mb-1">Important Note</p>
              <p>The system will safely skip any orders that are not eligible for this transition (e.g., trying to cancel an already delivered order).</p>
            </div>
          </div>

          {requireReason && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Reason (Optional for Bulk)</label>
              <input
                type="text"
                placeholder="e.g. Customer requested cancellation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isLoading}
            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleConfirm} 
            disabled={isLoading}
            className={
              "px-5 py-2.5 text-white font-bold rounded-xl transition-all flex items-center shadow-sm disabled:opacity-50 active:scale-95 " +
              (targetStatus === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20')
            }
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm {countToProcess} Orders
          </button>
        </div>
      </div>
    </div>
  );
}
