'use client';

import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ResetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetSettingsModal({
  isOpen,
  onClose,
  onConfirm,
}: ResetSettingsModalProps) {
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      onConfirm();
      setIsResetting(false);
      toast.success('Platform settings reset to initial factory defaults!');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <RotateCcw className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Reset Platform Settings?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to restore all general configuration and defaults back to factory settings? This action cannot be reversed.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isResetting}
              onClick={handleReset}
              className="px-4.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isResetting ? 'Resetting...' : 'Yes, Reset All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
