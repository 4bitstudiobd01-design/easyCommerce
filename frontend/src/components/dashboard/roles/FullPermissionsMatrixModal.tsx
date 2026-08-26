'use client';

import React, { useState } from 'react';
import {
  X,
  Shield,
  Pencil,
  Eye,
  Minus,
  Ban,
  Download,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { PermissionMatrixRow, PermissionLevel } from './types';
import { PERMISSION_MATRIX_ROWS } from './rolesMockData';

interface FullPermissionsMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullPermissionsMatrixModal({
  isOpen,
  onClose,
}: FullPermissionsMatrixModalProps) {
  const [matrixState, setMatrixState] =
    useState<PermissionMatrixRow[]>(PERMISSION_MATRIX_ROWS);

  if (!isOpen) return null;

  const cyclePermission = (
    rowId: string,
    roleKey: keyof Omit<PermissionMatrixRow, 'id' | 'module' | 'iconName'>
  ) => {
    const levels: PermissionLevel[] = [
      'Full Access',
      'Create / Edit',
      'View Only',
      'No Permission',
    ];

    setMatrixState((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const current = row[roleKey];
        const nextIndex = (levels.indexOf(current) + 1) % levels.length;
        return {
          ...row,
          [roleKey]: levels[nextIndex],
        };
      })
    );
  };

  const handleSave = () => {
    toast.success('Permissions matrix saved and synchronized across all active sessions!');
    onClose();
  };

  const renderBadge = (level: PermissionLevel) => {
    switch (level) {
      case 'Full Access':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Full Access
          </span>
        );
      case 'Create / Edit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Pencil className="w-2.5 h-2.5" />
            Create / Edit
          </span>
        );
      case 'View Only':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Eye className="w-2.5 h-2.5" />
            View Only
          </span>
        );
      case 'No Permission':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-400">
            <Minus className="w-2.5 h-2.5" />
            None
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Complete Permissions Matrix
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any cell to toggle access rights for that specific module and role.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
                <th className="py-3 px-4">Platform Module</th>
                <th className="py-3 px-3 text-center">Super Admin</th>
                <th className="py-3 px-3 text-center">Platform Manager</th>
                <th className="py-3 px-3 text-center">Support Agent</th>
                <th className="py-3 px-3 text-center">Finance Admin</th>
                <th className="py-3 px-3 text-center">Content Manager</th>
                <th className="py-3 px-3 text-center">Read Only Analyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {matrixState.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {row.module}
                  </td>
                  <td
                    className="py-3.5 px-3 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors"
                    onClick={() => cyclePermission(row.id, 'superAdmin')}
                  >
                    {renderBadge(row.superAdmin)}
                  </td>
                  <td
                    className="py-3.5 px-3 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors"
                    onClick={() => cyclePermission(row.id, 'platformManager')}
                  >
                    {renderBadge(row.platformManager)}
                  </td>
                  <td
                    className="py-3.5 px-3 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors"
                    onClick={() => cyclePermission(row.id, 'supportAgent')}
                  >
                    {renderBadge(row.supportAgent)}
                  </td>
                  <td
                    className="py-3.5 px-3 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors"
                    onClick={() => cyclePermission(row.id, 'financeAdmin')}
                  >
                    {renderBadge(row.financeAdmin)}
                  </td>
                  <td
                    className="py-3.5 px-3 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors"
                    onClick={() => cyclePermission(row.id, 'contentManager')}
                  >
                    {renderBadge(row.contentManager)}
                  </td>
                  <td
                    className="py-3.5 px-3 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors"
                    onClick={() => cyclePermission(row.id, 'readOnlyAnalyst')}
                  >
                    {renderBadge(row.readOnlyAnalyst)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => toast.info('Exporting full matrix as XLSX...')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Matrix</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs shadow-[#008060]/30 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Matrix Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
