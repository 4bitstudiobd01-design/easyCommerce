'use client';

import React, { useState } from 'react';
import { X, Mail, Copy, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserRole } from './types';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUserRole>('Support Agent');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    toast.success(`Invitation link sent to ${email}`);
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://easyco.com/admin/invite?token=exp_998124_adm');
    setCopied(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
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
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Invite Admin User</h3>
              <p className="text-[11px] text-slate-400">
                Send an onboard activation invite via email.
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
        <form onSubmit={handleSendInvite} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. colleague@easyco.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assign Role *
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminUserRole)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Platform Manager">Platform Manager</option>
                <option value="Support Agent">Support Agent</option>
                <option value="Finance Admin">Finance Admin</option>
                <option value="Security Admin">Security Admin</option>
                <option value="Others">Others</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Copy Link */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-[11px] text-slate-500 font-medium">
              Or copy a direct invite link:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="https://easyco.com/admin/invite?token=exp_998124_adm"
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
