'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  Key,
  Users,
  Layers,
  Calendar,
  Clock,
  Trash2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { PermissionRecord } from './types';

interface PermissionDetailsDrawerProps {
  permission: PermissionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDeletePermission?: (permission: PermissionRecord) => void;
}

export function PermissionDetailsDrawer({
  permission,
  isOpen,
  onClose,
  onDeletePermission,
}: PermissionDetailsDrawerProps) {
  if (!isOpen || !permission) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(permission.permissionKey);
    toast.success(`Copied key: ${permission.permissionKey}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Permission Details
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs scrollbar-thin scrollbar-thumb-slate-200">
            {/* Top Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-emerald-50 text-[#008060] border border-emerald-100 shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {permission.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {permission.description}
                </p>
              </div>

              {/* Monospace Key with copy */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="font-mono text-xs font-bold text-emerald-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {permission.permissionKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer shadow-2xs"
                  title="Copy Key"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scope details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase pb-1 border-b border-slate-100">
                Scope & Action Parameters
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Target Module
                  </span>
                  <p className="font-bold text-slate-800 text-xs">
                    {permission.module}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Operation Action
                  </span>
                  <p className="font-bold text-slate-800 text-xs">
                    {permission.action}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase pb-1 border-b border-slate-100">
                Current Role & User Assignments
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700 font-medium">Assigned Roles</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {permission.assignedRolesCount} Roles
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700 font-medium">Users with Permission</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {permission.assignedUsersCount} Admin Users
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span className="text-slate-700 font-medium">Permission Groups</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {permission.assignedGroupsCount} Bundles
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-2 text-slate-500 pt-1">
              <div className="flex items-center justify-between">
                <span>Created Date</span>
                <span className="font-semibold text-slate-700">
                  {permission.createdAtDate} {permission.createdAtTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Synchronized</span>
                <span className="font-semibold text-slate-700">
                  {permission.updatedAtDate} {permission.updatedAtTime}
                </span>
              </div>
            </div>

            {/* Delete button if custom */}
            {permission.type === 'Custom' && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onDeletePermission?.(permission);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Custom Permission</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
