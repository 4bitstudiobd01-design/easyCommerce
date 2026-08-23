'use client';

import React from 'react';
import { Plus, Upload, Grid, ChevronRight } from 'lucide-react';

interface PermissionsQuickActionsCardProps {
  onCreatePermission: () => void;
  onImportPermissions: () => void;
  onViewMatrix: () => void;
}

export function PermissionsQuickActionsCard({
  onCreatePermission,
  onImportPermissions,
  onViewMatrix,
}: PermissionsQuickActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
        Quick Actions
      </h3>

      <div className="space-y-2.5">
        {/* Action 1: Create Permission */}
        <div
          onClick={onCreatePermission}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#008060] flex items-center justify-center shrink-0 border border-emerald-100">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#008060] block leading-tight truncate">
                Create Permission
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Add a new custom permission
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#008060] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Action 2: Import Permissions */}
        <div
          onClick={onImportPermissions}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Upload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block leading-tight truncate">
                Import Permissions
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Import permissions from file
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Action 3: Permission Matrix */}
        <div
          onClick={onViewMatrix}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Grid className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 block leading-tight truncate">
                Permission Matrix
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                View permissions matrix
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>
      </div>
    </div>
  );
}
