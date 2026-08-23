'use client';

import React, { useState } from 'react';
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Copy,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  Layers,
  ArrowLeftRight,
  Headphones,
  BarChart2,
  FileText,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { PermissionRecord, PermissionActionType } from './types';

interface PermissionsTableProps {
  permissions: PermissionRecord[];
  totalCount?: number;
  currentPage: number;
  rowsPerPage: number;
  selectedPermissionId?: string;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onSelectPermission: (permission: PermissionRecord) => void;
  onEditPermission: (permission: PermissionRecord) => void;
  onDeletePermission: (permission: PermissionRecord) => void;
}

export function PermissionsTable({
  permissions,
  totalCount = 96,
  currentPage,
  rowsPerPage,
  selectedPermissionId,
  onPageChange,
  onRowsPerPageChange,
  onSelectPermission,
  onEditPermission,
  onDeletePermission,
}: PermissionsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isAllSelected =
    permissions.length > 0 && selectedIds.length === permissions.length;

  const handleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(permissions.map((p) => p.id));
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getModuleIcon = (name: string) => {
    const iconClass = 'w-3.5 h-3.5 text-slate-500 shrink-0';
    switch (name) {
      case 'LayoutDashboard':
      case 'Dashboard':
        return <LayoutDashboard className={iconClass} />;
      case 'Users':
      case 'Merchants':
        return <Users className={iconClass} />;
      case 'Store':
      case 'Stores':
        return <Store className={iconClass} />;
      case 'CreditCard':
      case 'Subscriptions':
        return <CreditCard className={iconClass} />;
      case 'Layers':
      case 'Plans':
        return <Layers className={iconClass} />;
      case 'ArrowLeftRight':
      case 'Transactions':
        return <ArrowLeftRight className={iconClass} />;
      case 'Headphones':
      case 'Support':
        return <Headphones className={iconClass} />;
      case 'BarChart2':
      case 'Reports':
        return <BarChart2 className={iconClass} />;
      default:
        return <LayoutDashboard className={iconClass} />;
    }
  };

  const getActionBadge = (action: PermissionActionType) => {
    switch (action) {
      case 'Delete':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/80 whitespace-nowrap">
            Delete
          </span>
        );
      case 'Refund':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
            Refund
          </span>
        );
      case 'Create / Edit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            Create / Edit
          </span>
        );
      case 'Update':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            Update
          </span>
        );
      case 'View':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            View
          </span>
        );
    }
  };

  const getTypeBadge = (type: PermissionRecord['type']) => {
    return type === 'System' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap">
        System
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 whitespace-nowrap">
        Custom
      </span>
    );
  };

  const handleCopyKey = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    toast.success(`Copied key: ${key}`);
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage) || 10;
  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, totalCount);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Table container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[880px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 pl-4 sm:pl-5 pr-2 w-10 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded-md border-slate-300 text-[#008060] focus:ring-[#008060]/20 cursor-pointer accent-[#008060]"
                />
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[180px]">
                Permission Name
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[150px]">
                <div className="flex items-center gap-1">
                  <span>Permission Key</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[120px]">
                Module
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                Action
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                Type
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                Status
              </th>
              <th className="py-3.5 pr-4 sm:pr-5 pl-2 text-right font-semibold text-slate-500 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {permissions.map((perm) => {
              const isSelected = selectedPermissionId === perm.id;
              const isChecked = selectedIds.includes(perm.id);
              const isMenuOpen = activeMenuId === perm.id;

              return (
                <tr
                  key={perm.id}
                  onClick={() => onSelectPermission(perm)}
                  className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td
                    className="py-4 pl-4 sm:pl-5 pr-2 whitespace-nowrap"
                    onClick={(e) => handleToggleRow(perm.id, e)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded-md border-slate-300 text-[#008060] focus:ring-[#008060]/20 cursor-pointer accent-[#008060]"
                    />
                  </td>

                  {/* Name & Description */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block text-xs group-hover:text-[#008060] transition-colors">
                      {perm.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                      {perm.description}
                    </span>
                  </td>

                  {/* Permission Key (Green Monospace) */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span
                      onClick={(e) => handleCopyKey(perm.permissionKey, e)}
                      title="Click to copy key"
                      className="font-mono text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100/80 transition-colors cursor-copy"
                    >
                      {perm.permissionKey}
                    </span>
                  </td>

                  {/* Module */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      {getModuleIcon(perm.moduleIconName || perm.module)}
                      <span>{perm.module}</span>
                    </div>
                  </td>

                  {/* Action Badge */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    {getActionBadge(perm.action)}
                  </td>

                  {/* Type Badge */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    {getTypeBadge(perm.type)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Active
                    </span>
                  </td>

                  {/* Actions Menu */}
                  <td
                    className="py-4 pr-4 sm:pr-5 pl-2 text-right relative whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuId(isMenuOpen ? null : perm.id)
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
                              onSelectPermission(perm);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              setActiveMenuId(null);
                              handleCopyKey(perm.permissionKey, e);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Key</span>
                          </button>

                          {perm.type === 'Custom' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditPermission(perm);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Permission</span>
                              </button>

                              <div className="h-px bg-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDeletePermission(perm);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete</span>
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
      <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="text-slate-500 font-normal whitespace-nowrap">
          Showing <span className="font-semibold text-slate-700">{startIndex}</span> to{' '}
          <span className="font-semibold text-slate-700">{endIndex}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalCount}</span> permissions
        </div>

        {/* Numbered pagination */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(1)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
              currentPage === 1
                ? 'bg-emerald-50 text-[#008060] border border-emerald-300 font-bold'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            1
          </button>

          <button
            type="button"
            onClick={() => onPageChange(2)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
              currentPage === 2
                ? 'bg-emerald-50 text-[#008060] border border-emerald-300 font-bold'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            2
          </button>

          <button
            type="button"
            onClick={() => onPageChange(3)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
              currentPage === 3
                ? 'bg-emerald-50 text-[#008060] border border-emerald-300 font-bold'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            3
          </button>

          <span className="px-1 text-slate-400">...</span>

          <button
            type="button"
            onClick={() => onPageChange(10)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
              currentPage === 10
                ? 'bg-emerald-50 text-[#008060] border border-emerald-300 font-bold'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            10
          </button>

          <button
            type="button"
            disabled={currentPage === 10}
            onClick={() => onPageChange(Math.min(10, currentPage + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rows per page */}
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
