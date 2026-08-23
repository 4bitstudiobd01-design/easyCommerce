'use client';

import React from 'react';
import { Plus, Copy, Users, Key, ChevronRight } from 'lucide-react';

interface RolesQuickActionsCardProps {
  onCreateRole: () => void;
  onCopyRole: () => void;
  onManageGroups: () => void;
  onReviewAccessRequests: () => void;
  pendingRequestsCount?: number;
}

export function RolesQuickActionsCard({
  onCreateRole,
  onCopyRole,
  onManageGroups,
  onReviewAccessRequests,
  pendingRequestsCount = 3,
}: RolesQuickActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
        Quick Actions
      </h3>

      <div className="space-y-2.5">
        {/* Action 1: Create Role */}
        <div
          onClick={onCreateRole}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 block leading-tight truncate">
                Create Role
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Add a new role with custom permissions
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Action 2: Copy Role */}
        <div
          onClick={onCopyRole}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Copy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 block leading-tight truncate">
                Copy Role
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Create a new role by copying permissions
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Action 3: Permission Groups */}
        <div
          onClick={onManageGroups}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block leading-tight truncate">
                Permission Groups
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Manage permission groups
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Action 4: Access Requests */}
        <div
          onClick={onReviewAccessRequests}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Key className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700 block leading-tight truncate">
                  Access Requests
                </span>
                {pendingRequestsCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {pendingRequestsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Review user access requests
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>
      </div>
    </div>
  );
}
