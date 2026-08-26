'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ClearCacheModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearCacheModal({
  isOpen,
  onClose,
  onConfirm,
}: ClearCacheModalProps) {
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const handleClear = () => {
    setIsClearing(true);
    setTimeout(() => {
      onConfirm();
      setIsClearing(false);
      toast.success('Platform cache, sessions, and temp data cleared successfully!');
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
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <Trash2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Clear All Platform Cache?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This will purge all Redis caches, CDN edge cache, configuration caches, and merchant session tokens. Active users may experience a temporary reload.
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
              disabled={isClearing}
              onClick={handleClear}
              className="px-4.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isClearing ? 'Clearing...' : 'Yes, Clear Cache'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
