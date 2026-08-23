'use client';

import React, { useState } from 'react';
import { X, Copy, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { RoleRecord } from './types';

interface CopyRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceRole: RoleRecord | null;
  onCopyComplete: (newRole: Partial<RoleRecord>) => void;
}

export function CopyRoleModal({
  isOpen,
  onClose,
  sourceRole,
  onCopyComplete,
}: CopyRoleModalProps) {
  const [name, setName] = useState(
    sourceRole ? `${sourceRole.name} (Copy)` : ''
  );
  const [description, setDescription] = useState(
    sourceRole
      ? `Cloned from ${sourceRole.name}. ${sourceRole.description}`
      : ''
  );

  if (!isOpen || !sourceRole) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    onCopyComplete({
      name: name.trim(),
      type: 'Custom Role',
      description: description.trim(),
      usersCount: 0,
      status: 'Active',
      createdAtDate: dateStr,
      createdAtTime: timeStr,
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr,
      isSystem: false,
    });

    toast.success(`Role copied as "${name}"!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Duplicate Role</h3>
              <p className="text-[11px] text-slate-400">
                Clone permissions from {sourceRole.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Role Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs shadow-[#008060]/30 transition-all cursor-pointer"
            >
              Create Clone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
