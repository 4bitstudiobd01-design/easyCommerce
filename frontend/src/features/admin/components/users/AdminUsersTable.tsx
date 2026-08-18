'use client';

import React, { useMemo, useState } from 'react';
import { Search, Filter, ChevronDown, MoreVertical, ShieldCheck, ShieldOff } from 'lucide-react';
import { StatusBadge } from '../core/StatusBadge';
import { ADMIN_USERS, ADMIN_USERS_TOTAL_COUNT, AdminRole, AdminUserStatus } from '../../data/admin-users.mock';

const ROLE_BADGE: Record<AdminRole, string> = {
  'Super Admin': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Platform Manager': 'bg-blue-50 text-blue-700 border-blue-200',
  'Support Agent': 'bg-amber-50 text-amber-700 border-amber-200',
  'Finance Admin': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_TO_BADGE: Record<AdminUserStatus, 'active' | 'neutral' | 'suspended'> = {
  Active: 'active',
  Inactive: 'neutral',
  Suspended: 'suspended',
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export function AdminUsersTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const filteredUsers = useMemo(() => {
    return ADMIN_USERS.filter((u) => {
      const matchesQuery =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All Status' || u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [searchQuery, roleFilter, statusFilter]);

  return (
    <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
      {/* Filter bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email or username..."
            className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 pl-3.5 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option>All Roles</option>
            <option>Super Admin</option>
            <option>Platform Manager</option>
            <option>Support Agent</option>
            <option>Finance Admin</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-3.5 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Suspended</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            defaultValue="Last Login"
            className="h-10 pl-3.5 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option>Last Login</option>
            <option>Created At</option>
            <option>Name (A-Z)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          type="button"
          className="h-10 px-3.5 flex items-center gap-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">User</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Last Login</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Two-Factor Auth</th>
              <th className="px-4 py-3.5">Created At</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No admin users found matching your query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                        {initialsOf(u.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-sm text-slate-900 block truncate">{u.name}</span>
                        <span className="text-[11px] text-slate-400 font-medium truncate block">{u.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${ROLE_BADGE[u.role]}`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge status={STATUS_TO_BADGE[u.status]} label={u.status} />
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{u.lastLoginDate}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{u.lastLoginTime}</span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {u.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold">
                        <ShieldOff className="w-3.5 h-3.5" />
                        <span>Disabled</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{u.createdDate}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{u.createdTime}</span>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      title="More actions"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="px-4 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 font-medium">
          Showing 1 to {filteredUsers.length} of {ADMIN_USERS_TOTAL_COUNT} users
        </span>

        <div className="flex items-center gap-1">
          {[1, 2].map((page) => (
            <button
              key={page}
              type="button"
              className={`w-7 h-7 rounded-lg font-bold transition-colors ${
                page === 1 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            defaultValue="10"
            className="h-8 pl-3 pr-7 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="10">Rows per page: 10</option>
            <option value="25">Rows per page: 25</option>
            <option value="50">Rows per page: 50</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
