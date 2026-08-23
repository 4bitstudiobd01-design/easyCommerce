'use client';

import React, { useState } from 'react';
import { X, Plus, Key, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionRecord, PermissionActionType } from './types';

interface CreatePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPermission: (perm: Partial<PermissionRecord>) => void;
}

export function CreatePermissionModal({
  isOpen,
  onClose,
  onAddPermission,
}: CreatePermissionModalProps) {
  const [name, setName] = useState('');
  const [permissionKey, setPermissionKey] = useState('');
  const [module, setModule] = useState('Dashboard');
  const [action, setAction] = useState<PermissionActionType>('View');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!permissionKey || permissionKey === `${module.toLowerCase()}.view`) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '_');
      setPermissionKey(`${module.toLowerCase()}.${slug}`);
    }
  };

  const handleModuleChange = (mod: string) => {
    setModule(mod);
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'custom_action';
    setPermissionKey(`${mod.toLowerCase()}.${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !permissionKey.trim()) {
      toast.error('Please enter permission name and key');
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

    onAddPermission({
      name: name.trim(),
      permissionKey: permissionKey.trim().toLowerCase(),
      module,
      moduleIconName: module,
      action,
      type: 'Custom',
      status: 'Active',
      description: description.trim() || `Can ${action.toLowerCase()} ${module.toLowerCase()}`,
      createdAtDate: dateStr,
      createdAtTime: timeStr,
      updatedAtDate: dateStr,
      updatedAtTime: timeStr,
      assignedRolesCount: 1,
      assignedUsersCount: 1,
      assignedGroupsCount: 1,
    });

    toast.success(`Permission "${name}" created successfully!`);
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
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#008060] flex items-center justify-center border border-emerald-100">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create New Permission</h3>
              <p className="text-[11px] text-slate-400">
                Register a new granular capability in the RBAC registry.
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
          {/* Permission Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Permission Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Export Store Financials"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-[#008060] focus:outline-hidden font-medium"
            />
          </div>

          {/* Permission Key */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Permission Key (Unique identifier) *
            </label>
            <input
              type="text"
              required
              value={permissionKey}
              onChange={(e) => setPermissionKey(e.target.value)}
              placeholder="e.g. stores.export_financials"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-mono focus:bg-white focus:border-[#008060] focus:outline-hidden font-semibold text-emerald-600"
            />
          </div>

          {/* Module & Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Module *
              </label>
              <div className="relative">
                <select
                  value={module}
                  onChange={(e) => handleModuleChange(e.target.value)}
                  className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-[#008060] focus:outline-hidden font-medium cursor-pointer"
                >
                  <option value="Dashboard">Dashboard</option>
                  <option value="Merchants">Merchants</option>
                  <option value="Stores">Stores</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Plans">Plans</option>
                  <option value="Transactions">Transactions</option>
                  <option value="Support">Support</option>
                  <option value="Reports">Reports</option>
                  <option value="Settings">Settings</option>
                  <option value="Audit Logs">Audit Logs</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Action *
              </label>
              <div className="relative">
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as PermissionActionType)}
                  className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-[#008060] focus:outline-hidden font-medium cursor-pointer"
                >
                  <option value="View">View</option>
                  <option value="Create / Edit">Create / Edit</option>
                  <option value="Delete">Delete</option>
                  <option value="Update">Update</option>
                  <option value="Refund">Refund</option>
                  <option value="Export">Export</option>
                  <option value="Manage">Manage</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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
              placeholder="Describe what capabilities this permission unlocks..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-[#008060] focus:outline-hidden font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Footer */}
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
              Create Permission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
