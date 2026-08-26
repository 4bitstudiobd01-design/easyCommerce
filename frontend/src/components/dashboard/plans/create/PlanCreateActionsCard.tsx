'use client';

import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';

interface PlanCreateActionsCardProps {
  onSaveDraft: () => void;
  onClearForm: () => void;
}

export function PlanCreateActionsCard({
  onSaveDraft,
  onClearForm,
}: PlanCreateActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 text-xs">
      <h3 className="font-bold text-slate-900 tracking-tight">Actions</h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <Bookmark className="w-3.5 h-3.5 text-slate-500" />
          <span>Save as Draft</span>
        </button>

        <button
          type="button"
          onClick={onClearForm}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 rounded-xl font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Form</span>
        </button>
      </div>
    </div>
  );
}
