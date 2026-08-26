'use client';

import React, { useState } from 'react';
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Copy,
  Shield,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { RoleRecord } from './types';

interface RolesTableProps {
  roles: RoleRecord[];
  selectedRoleId?: string;
  onSelectRole: (role: RoleRecord) => void;
  onEditRole: (role: RoleRecord) => void;
  onCopyRole: (role: RoleRecord) => void;
  onDeleteRole: (role: RoleRecord) => void;
  onViewPermissions: (role: RoleRecord) => void;
}

export function RolesTable({
  roles,
  selectedRoleId,
  onSelectRole,
  onEditRole,
  onCopyRole,
  onDeleteRole,
  onViewPermissions,
}: RolesTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getRoleTypeBadge = (type: RoleRecord['type']) => {
    switch (type) {
      case 'System Role':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap">
            System Role
          </span>
        );
      case 'Custom Role':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 whitespace-nowrap">
            Custom Role
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-0">
      {/* Table Header Section */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
          Roles
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          {roles.length} total active roles configured
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 pl-5 pr-3 font-semibold text-slate-500 whitespace-nowrap min-w-[180px]">
                Role Name
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 min-w-[260px]">
                Description
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap text-center">
                Users
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                Status
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[140px]">
                Last Updated
              </th>
              <th className="py-3.5 pr-5 pl-2 text-right font-semibold text-slate-500 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {roles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const isMenuOpen = activeMenuId === role.id;

              return (
                <tr
                  key={role.id}
                  onClick={() => onSelectRole(role)}
                  className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  {/* Role Name + Type Badge */}
                  <td className="py-4 pl-5 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs group-hover:text-[#008060] transition-colors">
                        {role.name}
                      </span>
                      {getRoleTypeBadge(role.type)}
                    </div>
                  </td>

                  {/* Description */}
                  <td className="py-4 px-3 text-slate-500 text-xs">
                    <span className="line-clamp-2">{role.description}</span>
                  </td>

                  {/* Users Count Pill */}
                  <td className="py-4 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-[#008060] font-bold text-xs border border-emerald-200/60">
                      {role.usersCount}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {role.status}
                    </span>
                  </td>

                  {/* Last Updated */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span className="font-medium text-slate-700 block text-xs whitespace-nowrap">
                      {role.lastUpdatedDate}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal block whitespace-nowrap mt-0.5">
                      {role.lastUpdatedTime}
                    </span>
                  </td>

                  {/* Actions Menu */}
                  <td
                    className="py-4 pr-5 pl-2 text-right relative whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuId(isMenuOpen ? null : role.id)
                      }
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown */}
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
                              onSelectRole(role);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onViewPermissions(role);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            <span>Permissions Matrix</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onCopyRole(role);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Role</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onEditRole(role);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Role</span>
                          </button>

                          {!role.isSystem && (
                            <>
                              <div className="h-px bg-slate-100 my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDeleteRole(role);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Role</span>
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3.5 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="text-slate-500 font-normal whitespace-nowrap">
          Showing <span className="font-semibold text-slate-700">1</span> to{' '}
          <span className="font-semibold text-slate-700">{roles.length}</span> of{' '}
          <span className="font-semibold text-slate-700">{roles.length}</span> roles
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 opacity-50 cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold bg-emerald-50 text-[#008060] border border-emerald-300 cursor-pointer"
          >
            1
          </button>

          <button
            type="button"
            disabled
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 opacity-50 cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-slate-500 text-xs">Rows per page</span>
          <div className="relative">
            <select
              defaultValue={10}
              className="appearance-none pl-2.5 pr-6 py-1 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 cursor-pointer shadow-2xs focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
