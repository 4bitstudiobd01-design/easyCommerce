'use client';

import React, { useState } from 'react';
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Shield,
  KeyRound,
  UserCheck,
  UserX,
  Trash2,
  AlertCircle,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { AdminUserRecord, AdminUserRole, AdminUserStatus } from './types';

interface UsersTableProps {
  users: AdminUserRecord[];
  totalUsersCount?: number;
  currentPage: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onViewUser: (user: AdminUserRecord) => void;
  onEditUser: (user: AdminUserRecord) => void;
  onChangeRole: (user: AdminUserRecord, role: AdminUserRole) => void;
  onToggleStatus: (user: AdminUserRecord) => void;
  onResetPassword: (user: AdminUserRecord) => void;
  onDeleteUser: (user: AdminUserRecord) => void;
}

export function UsersTable({
  users,
  totalUsersCount = 18,
  currentPage,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onViewUser,
  onEditUser,
  onChangeRole,
  onToggleStatus,
  onResetPassword,
  onDeleteUser,
}: UsersTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getRoleBadge = (role: AdminUserRole) => {
    switch (role) {
      case 'Super Admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap">
            Super Admin
          </span>
        );
      case 'Platform Manager':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap">
            Platform Manager
          </span>
        );
      case 'Support Agent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 whitespace-nowrap">
            Support Agent
          </span>
        );
      case 'Finance Admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 whitespace-nowrap">
            Finance Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {role}
          </span>
        );
    }
  };

  const getStatusBadge = (status: AdminUserStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Active
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            Inactive
          </span>
        );
      case 'Suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const get2FaBadge = (enabled: boolean) => {
    return enabled ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
        Enabled
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
        Disabled
      </span>
    );
  };

  // Pagination calculation
  const totalPages = Math.ceil(totalUsersCount / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, totalUsersCount);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[880px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 pl-4 sm:pl-6 pr-3 font-semibold text-slate-500 whitespace-nowrap min-w-[200px]">
                User
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>Role</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[130px]">
                <div className="flex items-center gap-1">
                  <span>Last Login</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                Two-Factor Auth
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[130px]">
                <div className="flex items-center gap-1">
                  <span>Created At</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 pr-4 sm:pr-6 pl-2 text-right font-semibold text-slate-500 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No admin users found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Try adjusting your search or role filters.
                  </p>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isMenuOpen = activeMenuId === user.id;

                return (
                  <tr
                    key={user.id}
                    onClick={() => onViewUser(user)}
                    className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* User: Avatar + Name + Email */}
                    <td className="py-4 pl-4 sm:pl-6 pr-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs ${
                            user.avatarBgColor || 'bg-emerald-600'
                          }`}
                        >
                          {user.initials}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block text-xs group-hover:text-emerald-700 transition-colors truncate">
                            {user.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal block truncate mt-0.5">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700 block text-xs whitespace-nowrap">
                        {user.lastLoginDate}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block whitespace-nowrap mt-0.5">
                        {user.lastLoginTime}
                      </span>
                    </td>

                    {/* Two-Factor Auth */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      {get2FaBadge(user.twoFactorAuth)}
                    </td>

                    {/* Created At */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700 block text-xs whitespace-nowrap">
                        {user.createdAtDate}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block whitespace-nowrap mt-0.5">
                        {user.createdAtTime}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="py-4 pr-4 sm:pr-6 pl-2 text-right relative whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(isMenuOpen ? null : user.id)
                        }
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-4 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewUser(user);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>View Profile</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onEditUser(user);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit User</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onResetPassword(user);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                              <span>Reset Password</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onToggleStatus(user);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              {user.status === 'Active' ? (
                                <>
                                  <UserX className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Deactivate User</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Activate User</span>
                                </>
                              )}
                            </button>

                            <div className="h-px bg-slate-100 my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onDeleteUser(user);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete User</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Exact layout from Screenshot) */}
      <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        {/* Left: Showing count */}
        <div className="text-slate-500 font-normal whitespace-nowrap">
          Showing <span className="font-semibold text-slate-700">{startIndex}</span> to{' '}
          <span className="font-semibold text-slate-700">{endIndex}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalUsersCount}</span> users
        </div>

        {/* Center: Pagination Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
                currentPage === page
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Rows per page selector */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-slate-500 text-xs">Rows per page</span>
          <div className="relative">
            <select
              value={rowsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className="appearance-none pl-2.5 pr-6 py-1 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 cursor-pointer shadow-2xs focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
