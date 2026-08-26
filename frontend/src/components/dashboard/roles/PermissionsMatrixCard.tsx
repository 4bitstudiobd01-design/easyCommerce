'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  Layers,
  ArrowLeftRight,
  Headphones,
  ExternalLink,
  Pencil,
  Eye,
  Minus,
  Check,
  Ban,
} from 'lucide-react';
import { PermissionMatrixRow, PermissionLevel } from './types';
import { PERMISSION_MATRIX_ROWS } from './rolesMockData';

interface PermissionsMatrixCardProps {
  rows?: PermissionMatrixRow[];
  onOpenFullMatrix?: () => void;
}

export function PermissionsMatrixCard({
  rows = PERMISSION_MATRIX_ROWS,
  onOpenFullMatrix,
}: PermissionsMatrixCardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'Module View' | 'Action View'>('Module View');

  const getModuleIcon = (name: string) => {
    const iconClass = 'w-3.5 h-3.5 text-slate-500';
    switch (name) {
      case 'LayoutDashboard':
        return <LayoutDashboard className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      case 'Store':
        return <Store className={iconClass} />;
      case 'CreditCard':
        return <CreditCard className={iconClass} />;
      case 'Layers':
        return <Layers className={iconClass} />;
      case 'ArrowLeftRight':
        return <ArrowLeftRight className={iconClass} />;
      case 'Headphones':
        return <Headphones className={iconClass} />;
      default:
        return <LayoutDashboard className={iconClass} />;
    }
  };

  const renderPermissionBadge = (level: PermissionLevel) => {
    switch (level) {
      case 'Full Access':
        return (
          <div className="flex items-center justify-center">
            <span
              className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300 shadow-2xs"
              title="Full Access"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </span>
          </div>
        );
      case 'Create / Edit':
        return (
          <div className="flex items-center justify-center">
            <span
              className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 shadow-2xs"
              title="Create / Edit"
            >
              <Pencil className="w-2.5 h-2.5 text-amber-700 stroke-[2.5]" />
            </span>
          </div>
        );
      case 'View Only':
        return (
          <div className="flex items-center justify-center">
            <span
              className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-300 shadow-2xs"
              title="View Only"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            </span>
          </div>
        );
      case 'No Access':
        return (
          <div className="flex items-center justify-center">
            <span
              className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-300 shadow-2xs"
              title="No Access"
            >
              <Ban className="w-2.5 h-2.5 text-rose-600" />
            </span>
          </div>
        );
      case 'No Permission':
      default:
        return (
          <div className="flex items-center justify-center text-slate-300 font-bold">
            <Minus className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-0">
      {/* Header & Sub-Tabs */}
      <div className="px-5 pt-4 pb-0 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
          Permissions Matrix (Preview)
        </h3>

        {/* Sub-tabs */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('Module View')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'Module View'
                ? 'border-[#008060] text-[#008060] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Module View
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('Action View')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'Action View'
                ? 'border-[#008060] text-[#008060] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Action View
          </button>
        </div>
      </div>

      {/* Matrix Table Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 pl-5 pr-3 whitespace-nowrap min-w-[140px]">
                Module
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                Super Admin
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                Platform Manager
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                Support Agent
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                Finance Admin
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                Content Manager
              </th>
              <th className="py-3 pr-5 pl-3 text-center whitespace-nowrap">
                Read Only Analyst
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/70 transition-colors"
              >
                {/* Module Icon + Name */}
                <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getModuleIcon(row.iconName)}
                    <span className="font-semibold text-slate-800 text-xs">
                      {row.module}
                    </span>
                  </div>
                </td>

                {/* Role Matrix Columns */}
                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                  {renderPermissionBadge(row.superAdmin)}
                </td>
                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                  {renderPermissionBadge(row.platformManager)}
                </td>
                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                  {renderPermissionBadge(row.supportAgent)}
                </td>
                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                  {renderPermissionBadge(row.financeAdmin)}
                </td>
                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                  {renderPermissionBadge(row.contentManager)}
                </td>
                <td className="py-3.5 pr-5 pl-3 text-center whitespace-nowrap">
                  {renderPermissionBadge(row.readOnlyAnalyst)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Legend & View Full Matrix Link */}
      <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Full Access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Pencil className="w-2.5 h-2.5 text-amber-600 stroke-[3]" />
            <span>Create / Edit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>View Only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span>No Access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="w-2.5 h-2.5 text-slate-400" />
            <span>No Permission</span>
          </div>
        </div>

        {/* View Full Matrix Action */}
        <button
          type="button"
          onClick={onOpenFullMatrix}
          className="flex items-center gap-1 text-xs font-bold text-[#008060] hover:text-[#006e52] cursor-pointer shrink-0 transition-colors"
        >
          <span>View Full Matrix</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
