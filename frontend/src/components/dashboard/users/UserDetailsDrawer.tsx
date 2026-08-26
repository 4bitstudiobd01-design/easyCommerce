'use client';

import React from 'react';
import {
  X,
  Shield,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserRecord, AdminUserRole, AdminUserStatus } from './types';

interface UserDetailsDrawerProps {
  user: AdminUserRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onChangeRole: (user: AdminUserRecord, role: AdminUserRole) => void;
  onToggleStatus: (user: AdminUserRecord) => void;
  onResetPassword: (user: AdminUserRecord) => void;
  onDeleteUser: (user: AdminUserRecord) => void;
}

export function UserDetailsDrawer({
  user,
  isOpen,
  onClose,
  onChangeRole,
  onToggleStatus,
  onResetPassword,
  onDeleteUser,
}: UserDetailsDrawerProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Admin User Profile
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

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs scrollbar-thin scrollbar-thumb-slate-200">
            {/* User Profile Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center font-extrabold text-xl text-white shadow-md ${
                  user.avatarBgColor || 'bg-emerald-600'
                }`}
              >
                {user.initials}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{user.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{user.email}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                  {user.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                    user.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                  />
                  {user.status}
                </span>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase pb-1 border-b border-slate-100">
                Contact & Department Info
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Phone</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-xs truncate">
                    {user.phone || '+880 1700-000000'}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Department</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-xs truncate">
                    {user.department || 'Operations'}
                  </p>
                </div>
              </div>
            </div>

            {/* Security & Access */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase pb-1 border-b border-slate-100">
                Security & Activity Timestamps
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    {user.twoFactorAuth ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-slate-700 font-medium">Two-Factor Auth</span>
                  </div>
                  <span
                    className={`font-bold ${
                      user.twoFactorAuth ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    {user.twoFactorAuth ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 font-medium">Last Login</span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    {user.lastLoginDate} {user.lastLoginTime}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 font-medium">Created On</span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    {user.createdAtDate} {user.createdAtTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase pb-1 border-b border-slate-100">
                User Actions
              </h4>

              <button
                type="button"
                onClick={() => onResetPassword(user)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>Send Password Reset Email</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleStatus(user)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                  user.status === 'Active'
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                }`}
              >
                {user.status === 'Active' ? (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>Deactivate Account</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Activate Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onDeleteUser(user)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl font-bold cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Delete Admin User</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
