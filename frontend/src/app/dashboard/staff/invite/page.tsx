'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useInviteStaffMutation, StaffPermissionType } from '@/features/staff/api/staffApi';
import {
  UserPlus,
  Shield,
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const PRESET_ROLES: {
  id: string;
  name: string;
  description: string;
  permissions: StaffPermissionType[];
}[] = [
  {
    id: 'STORE_MANAGER',
    name: 'Store Manager (স্টোর ম্যানেজার)',
    description: 'ফুল এক্সেস (স্টাফ পারমিশন ও স্টোর সেটিংস বাদে)',
    permissions: [
      'products:read',
      'products:write',
      'orders:read',
      'orders:manage',
      'inventory:read',
      'inventory:transfer',
      'reviews:read',
      'reviews:moderate',
      'customers:read',
      'coupons:read',
      'coupons:write',
      'analytics:read',
    ],
  },
  {
    id: 'INVENTORY_MANAGER',
    name: 'Inventory Manager (ইনভেন্টরি ম্যানেজার)',
    description: 'প্রোডাক্ট ক্যাটালগ ও মাল্টি-ওয়্যারহাউস স্টক ট্রান্সফার এক্সেস',
    permissions: ['products:read', 'products:write', 'inventory:read', 'inventory:transfer'],
  },
  {
    id: 'ORDER_FULFILLMENT',
    name: 'Order Fulfillment (অর্ডার প্রসেসিং স্টাফ)',
    description: 'অর্ডার ম্যানেজমেন্ট, কুরিয়ার বুকিং ও স্টক ভিউ এক্সেস',
    permissions: ['orders:read', 'orders:manage', 'inventory:read'],
  },
  {
    id: 'CUSTOMER_SUPPORT',
    name: 'Customer Support (কাস্টমার সাপোর্ট)',
    description: 'কাস্টমার রিভিউ, কাস্টমার লিস্ট ও অর্ডার ভিউ এক্সেস',
    permissions: ['orders:read', 'reviews:read', 'reviews:moderate', 'customers:read'],
  },
  {
    id: 'CUSTOM',
    name: 'Custom Role (কাস্টম রুল)',
    description: 'আপনার পছন্দমতো নির্দিষ্ট পারমিশন সিলেক্ট করুন',
    permissions: ['products:read', 'orders:read'],
  },
];

const PERMISSION_GROUPS: {
  category: string;
  items: { key: StaffPermissionType; label: string; desc: string }[];
}[] = [
  {
    category: '🛍️ Products & Catalog',
    items: [
      { key: 'products:read', label: 'View Products', desc: 'প্রোডাক্ট ও ক্যাটাগরি দেখতে পারবে' },
      { key: 'products:write', label: 'Manage Products', desc: 'প্রোডাক্ট ক্রিয়েট, এডিট ও ডিলিট করতে পারবে' },
    ],
  },
  {
    category: '📦 Orders & Fulfillment',
    items: [
      { key: 'orders:read', label: 'View Orders', desc: 'অর্ডার লিস্ট দেখতে পারবে' },
      { key: 'orders:manage', label: 'Manage Orders', desc: 'অর্ডার স্ট্যাটাস আপডেট, ইনভয়েস প্রিন্ট ও কুরিয়ার বুকিং' },
    ],
  },
  {
    category: '🏬 Inventory & Stock',
    items: [
      { key: 'inventory:read', label: 'View Stock', desc: 'ওয়্যারহাউস স্টক লেভেল দেখতে পারবে' },
      { key: 'inventory:transfer', label: 'Manage Stock Transfers', desc: 'স্টক এডজাস্টমেন্ট ও ওয়্যারহাউস ট্রান্সফার' },
    ],
  },
  {
    category: '⭐ Reviews & Customers',
    items: [
      { key: 'reviews:read', label: 'View Reviews', desc: 'কাস্টমার রিভিউ দেখতে পারবে' },
      { key: 'reviews:moderate', label: 'Moderate Reviews', desc: 'রিভিউ এপ্রুভ বা রিজেক্ট করতে পারবে' },
      { key: 'customers:read', label: 'View Customers', desc: 'কাস্টমার লিস্ট ও পরিত্যক্ত কার্ট দেখতে পারবে' },
    ],
  },
  {
    category: '🎟️ Marketing & Analytics',
    items: [
      { key: 'coupons:read', label: 'View Coupons', desc: 'ডিসকাউন্ট কুপন দেখতে পারবে' },
      { key: 'coupons:write', label: 'Manage Coupons', desc: 'নতুন কুপন তৈরি ও এডিট করতে পারবে' },
      { key: 'analytics:read', label: 'View Analytics', desc: 'সেলস ও প্রফিট মার্জিন এনালিটিক্স' },
    ],
  },
  {
    category: '⚙️ Settings & Team',
    items: [
      { key: 'settings:read', label: 'View Settings', desc: 'স্টোর কনফিগারেশন দেখতে পারবে' },
      { key: 'settings:write', label: 'Modify Settings', desc: 'থিম, পেমেন্ট ও এসএমএস কনফিগ পরিবর্তন' },
      { key: 'staff:manage', label: 'Manage Staff', desc: 'অন্যান্য স্টাফদের ইনভাইট ও পারমিশন কন্ট্রোল' },
    ],
  },
  {
    category: '👥 Human Resources',
    items: [
      { key: 'hr:employees:read', label: 'View Employees', desc: 'এমপ্লয়ি ডিরেক্টরি দেখতে পারবে' },
      { key: 'hr:employees:manage', label: 'Manage Employees', desc: 'এমপ্লয়ি ও ডিপার্টমেন্ট যোগ, এডিট ও টার্মিনেট করতে পারবে' },
      { key: 'hr:attendance:manage', label: 'Manage Attendance', desc: 'এমপ্লয়ি অ্যাটেন্ডেন্স ট্র্যাক ও এডিট' },
      { key: 'hr:leave:manage', label: 'Approve Leave', desc: 'অন্যান্য এমপ্লয়ির ছুটির আবেদন এপ্রুভ বা রিজেক্ট' },
      { key: 'hr:leave:self', label: 'Self-Service Leave', desc: 'নিজের ছুটির আবেদন ও ব্যালেন্স দেখতে পারবে' },
      { key: 'hr:shifts:manage', label: 'Manage Shifts', desc: 'শিফট রোস্টার তৈরি ও নির্ধারণ' },
      { key: 'hr:expenses:manage', label: 'Manage Expenses', desc: 'ব্যবসায়িক খরচ রেকর্ড ও ট্র্যাক' },
      { key: 'hr:payroll:manage', label: 'Manage Payroll', desc: 'পে-রোল প্রসেসিং ও ট্যাক্স হিসাব' },
      { key: 'hr:notices:manage', label: 'Manage Notice Board', desc: 'এমপ্লয়িদের জন্য নোটিশ পোস্ট করতে পারবে' },
    ],
  },
];

export default function InviteStaffPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('STORE_MANAGER');
  const [permissions, setPermissions] = useState<StaffPermissionType[]>(
    PRESET_ROLES[0].permissions,
  );
  const [createdInviteToken, setCreatedInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [inviteStaff, { isLoading, error }] = useInviteStaffMutation();

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    const preset = PRESET_ROLES.find((r) => r.id === roleId);
    if (preset && roleId !== 'CUSTOM') {
      setPermissions(preset.permissions);
    }
  };

  const togglePermission = (perm: StaffPermissionType) => {
    setSelectedRole('CUSTOM');
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await inviteStaff({
        name,
        email,
        phone: phone || undefined,
        role: selectedRole,
        permissions,
      }).unwrap();

      toast.success('Staff invitation sent.');
      if (res.inviteToken) {
        setCreatedInviteToken(res.inviteToken);
      } else {
        router.push('/dashboard/staff');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to invite staff member.');
    }
  };

  const inviteUrl = createdInviteToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/staff-invite?token=${createdInviteToken}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Invitation link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    router.push('/dashboard/staff');
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600/30 border border-blue-400/30 rounded-2xl text-blue-400">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl leading-tight">Invite Staff Member</h1>
              <p className="text-sm text-slate-400 mt-1">Assign role and granular RBAC permissions</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {createdInviteToken ? (
          <div className="p-8 md:p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Staff Invitation Created!</h2>
              <p className="text-base text-slate-600 mt-2">
                <strong>{name}</strong> (<span>{email}</span>) has been invited to your store team.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-3">
              <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Invitation Link (১-ক্লিক ইনভাইট লিংক)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-500">
                Send this invitation link to the staff member to complete password setup.
              </p>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition text-lg"
            >
              Done & Return to Staff List
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{(error as any)?.data?.message || 'Failed to send staff invitation.'}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Full Name (স্টাফের নাম) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Email Address (ইমেইল এড্রেস) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="tanvir@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Phone Number (ফোন নম্বর - Optional)
                </label>
                <input
                  type="text"
                  placeholder="01711223344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Preset Roles */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-4 uppercase tracking-wider">
                Select Staff Role (স্টাফের ভূমিকা সিলেক্ট করুন)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRESET_ROLES.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <div
                      key={role.id}
                      onClick={() => handleRoleChange(role.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-4 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900">{role.name}</h5>
                        <p className="text-xs text-slate-500 leading-snug mt-1">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Granular Permission Checkboxes */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Granular Permissions Matrix ({permissions.length} Selected)
                </label>
                <span className="text-xs font-semibold text-slate-500">Check/uncheck to customize</span>
              </div>

              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.category} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
                    <h6 className="text-sm font-bold text-slate-800 mb-3">{group.category}</h6>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.items.map((item) => {
                        const isChecked = permissions.includes(item.key);
                        return (
                          <label
                            key={item.key}
                            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-white border-blue-300 shadow-sm'
                                : 'bg-transparent border-transparent opacity-70 hover:opacity-100 hover:bg-slate-100/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(item.key)}
                              className="mt-1 rounded border-slate-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                              <div className="text-xs text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 text-base font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3.5 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                {isLoading ? (
                  <>Sending Invitation...</>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" /> Send Invite Link
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
