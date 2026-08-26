'use client';

import React, { useState } from 'react';
import { X, UserPlus, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserRecord, AdminUserRole, AdminUserStatus } from './types';

interface AddAdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: Partial<AdminUserRecord>) => void;
}

export function AddAdminUserModal({
  isOpen,
  onClose,
  onAddUser,
}: AddAdminUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AdminUserRole>('Platform Manager');
  const [department, setDepartment] = useState('Product Management');
  const [status, setStatus] = useState<AdminUserStatus>('Active');
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please provide name and valid email');
      return;
    }

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const bgColors = [
      'bg-emerald-600',
      'bg-blue-600',
      'bg-purple-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-teal-600',
    ];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

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

    onAddUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+880 1700-000000',
      role,
      department,
      status,
      initials: initials || 'AU',
      avatarBgColor: randomBg,
      twoFactorAuth,
      createdAtDate: dateStr,
      createdAtTime: timeStr,
      lastLoginDate: 'Never',
      lastLoginTime: '—',
      permissionsCount: role === 'Super Admin' ? 42 : role === 'Platform Manager' ? 35 : 18,
    });

    toast.success(`Admin user ${name} created successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add New Admin User</h3>
              <p className="text-[11px] text-slate-400">
                Grant platform access and configure operational roles.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mahfuzur Rahman"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Work Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mahfuz@easyco.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Role *
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1712-345678"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800">Two-Factor Authentication</h4>
              <p className="text-[11px] text-slate-400">
                Require OTP authenticator code at login
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={twoFactorAuth}
              onClick={() => setTwoFactorAuth(!twoFactorAuth)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                twoFactorAuth ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  twoFactorAuth ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
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
              Create Admin User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
