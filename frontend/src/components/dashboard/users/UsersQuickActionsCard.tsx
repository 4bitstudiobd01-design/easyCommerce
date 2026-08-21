'use client';

import React from 'react';
import { UserPlus, Mail, Users, ChevronRight } from 'lucide-react';

interface UsersQuickActionsCardProps {
  onAddUser: () => void;
  onInviteUser: () => void;
  onBulkActions: () => void;
}

export function UsersQuickActionsCard({
  onAddUser,
  onInviteUser,
  onBulkActions,
}: UsersQuickActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
        Quick Actions
      </h3>

      <div className="space-y-2.5">
        {/* Action 1: Add Admin User */}
        <div
          onClick={onAddUser}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 block leading-tight truncate">
                Add Admin User
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Create a new platform admin user
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Action 2: Invite Users */}
        <div
          onClick={onInviteUser}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-blue-100">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block leading-tight truncate">
                Invite Users
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Invite users via email
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Action 3: Bulk Actions */}
        <div
          onClick={onBulkActions}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-purple-100">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 block leading-tight truncate">
                Bulk Actions
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Perform actions on multiple users
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>
      </div>
    </div>
  );
}
