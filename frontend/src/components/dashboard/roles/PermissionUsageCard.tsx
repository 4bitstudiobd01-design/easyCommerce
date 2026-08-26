'use client';

import React from 'react';
import { Shield, Users, Layers, ChevronRight } from 'lucide-react';
import { PermissionRecord } from './types';

interface PermissionUsageCardProps {
  permission: PermissionRecord;
  onViewRoles?: () => void;
  onViewUsers?: () => void;
  onViewGroups?: () => void;
}

export function PermissionUsageCard({
  permission,
  onViewRoles,
  onViewUsers,
  onViewGroups,
}: PermissionUsageCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
      {/* Header */}
      <div className="pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
          Permission Usage
        </h3>
        <p className="text-[11px] text-slate-400 font-normal mt-0.5">
          This permission is assigned to:
        </p>
      </div>

      <div className="space-y-2 text-xs">
        {/* Roles */}
        <div
          onClick={onViewRoles}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">Roles</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span>{permission.assignedRolesCount}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Users */}
        <div
          onClick={onViewUsers}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">Users</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span>{permission.assignedUsersCount}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Permission Groups */}
        <div
          onClick={onViewGroups}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">Permission Groups</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span>{permission.assignedGroupsCount}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
