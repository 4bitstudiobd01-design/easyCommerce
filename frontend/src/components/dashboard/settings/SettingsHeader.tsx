'use client';

import React from 'react';
import { Save } from 'lucide-react';

interface SettingsHeaderProps {
  isSaving: boolean;
  isDirty?: boolean;
  onSave: () => void;
}

export function SettingsHeader({
  isSaving,
  isDirty = true,
  onSave,
}: SettingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
          Manage global platform configuration and preferences.
        </p>
      </div>

      {/* Save Changes Action Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-[#008060]/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
