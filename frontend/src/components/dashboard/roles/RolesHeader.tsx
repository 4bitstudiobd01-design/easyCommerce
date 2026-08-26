'use client';

import React, { useState } from 'react';
import { Plus, MoreVertical, ChevronDown, Download, FileSpreadsheet, History } from 'lucide-react';
import { toast } from 'sonner';

interface RolesHeaderProps {
  onCreateRole: () => void;
  onExportMatrix?: () => void;
}

export function RolesHeader({ onCreateRole, onExportMatrix }: RolesHeaderProps) {
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Roles & Permissions
        </h1>
        <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
          Manage roles and control access to platform resources.
        </p>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Primary: + Create Role */}
        <button
          type="button"
          onClick={onCreateRole}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-[#008060]/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Role</span>
        </button>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
            <span>More Actions</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {isMoreActionsOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsMoreActionsOpen(false)}
              />
              <div className="absolute right-0 top-10 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreActionsOpen(false);
                    toast.info('Exporting roles configuration to CSV...');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Roles to CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreActionsOpen(false);
                    if (onExportMatrix) onExportMatrix();
                    else toast.info('Exporting Permissions Matrix...');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Matrix (XLSX)</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreActionsOpen(false);
                    toast.info('Navigating to role audit logs...');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Role Audit Logs</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
