'use client';

import React, { useState } from 'react';
import { Plus, Download, Grid, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionsHeaderProps {
  onCreatePermission: () => void;
  onExport: () => void;
}

export function PermissionsHeader({
  onCreatePermission,
  onExport,
}: PermissionsHeaderProps) {
  const [viewMode, setViewMode] = useState<'Module View' | 'Action View' | 'Flat List'>('Module View');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Permissions
        </h1>
        <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
          Manage and configure platform permissions. Permissions are organized by modules and actions.
        </p>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Module View Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-slate-500" />
            <span>{viewMode}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {isViewDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsViewDropdownOpen(false)}
              />
              <div className="absolute right-0 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-150">
                {(['Module View', 'Action View', 'Flat List'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setViewMode(mode);
                      setIsViewDropdownOpen(false);
                      toast.info(`Switched view to ${mode}`);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                      viewMode === mode ? 'text-[#008060] font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{mode}</span>
                    {viewMode === mode && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>

        {/* Primary: + Create Permission */}
        <button
          type="button"
          onClick={onCreatePermission}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-[#008060]/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Permission</span>
        </button>
      </div>
    </div>
  );
}
