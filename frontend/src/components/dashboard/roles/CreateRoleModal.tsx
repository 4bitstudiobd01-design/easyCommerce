'use client';

import React, { useState } from 'react';
import { X, Plus, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { RoleRecord, RoleType } from './types';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRole: (role: Partial<RoleRecord>) => void;
  existingRoles?: RoleRecord[];
}

export function CreateRoleModal({
  isOpen,
  onClose,
  onAddRole,
  existingRoles = [],
}: CreateRoleModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoleType>('Custom Role');
  const [description, setDescription] = useState('');
  const [cloneFromRoleId, setCloneFromRoleId] = useState('');

  if (!isOpen) return null;

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

    onAddRole({
      name: name.trim(),
      type,
      description:
        description.trim() || 'Custom platform role with assigned domain scopes.',
      usersCount: 0,
      status: 'Active',
      createdAtDate: dateStr,
      createdAtTime: timeStr,
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr,
      isSystem: false,
    });

    toast.success(`Role "${name}" created successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create New Role</h3>
              <p className="text-[11px] text-slate-400">
                Define a new access role and configure modular permissions.
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
          {/* Role Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Role Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Catalog Specialist"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* Role Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Role Type
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RoleType)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="Custom Role">Custom Role</option>
                <option value="System Role">System Role</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Clone Permissions From */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Copy Permissions from Existing Role (Optional)
            </label>
            <div className="relative">
              <select
                value={cloneFromRoleId}
                onChange={(e) => setCloneFromRoleId(e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="">Start with empty permissions</option>
                {existingRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the operational responsibilities and scope of this role..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Footer buttons */}
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
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
