'use client';

import React from 'react';
import { Info } from 'lucide-react';

interface PlanBottomBarProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function PlanBottomBar({
  onCancel,
  onSave,
  isSaving = false,
}: PlanBottomBarProps) {
  return (
    <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left Info Notice */}
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-slate-800 mr-1.5">Need to make changes?</span>
          <span className="text-slate-500">
            Changing plan features or limits may affect existing subscriptions. Please review the impact before saving.
          </span>
        </div>
      </div>

      {/* Right Buttons */}
      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
