'use client';

import React, { useState, useEffect } from 'react';
import { useGetStaffMembersQuery, useUpdateStaffPermissionsMutation, StaffPermissionType } from '@/features/staff/api/staffApi';
import { Shield, Save, AlertCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

const PRESET_ROLES: { id: string; name: string }[] = [
  { id: 'STORE_MANAGER', name: 'Store Manager (স্টোর ম্যানেজার)' },
  { id: 'INVENTORY_MANAGER', name: 'Inventory Manager (ইনভেন্টরি ম্যানেজার)' },
  { id: 'ORDER_FULFILLMENT', name: 'Order Fulfillment (অর্ডার প্রসেসিং স্টাফ)' },
  { id: 'CUSTOMER_SUPPORT', name: 'Customer Support (কাস্টমার সাপোর্ট)' },
  { id: 'CUSTOM', name: 'Custom Role (কাস্টম রুল)' },
];

const PERMISSION_GROUPS: {
  category: string;
  items: { key: StaffPermissionType; label: string; desc: string }[];
}[] = [
  {
    category: '🛍️ Products & Catalog',
    items: [
      { key: 'products:read', label: 'View Products', desc: 'প্রোডাক্ট ও ক্যাটাগরি দেখতে পারবে' },
      { key: 'products:write', label: 'Manage Products', desc: 'প্রোডাক্ট ক্রিয়েট, এডিট ও ডিলিট' },
    ],
  },
  {
    category: '📦 Orders & Fulfillment',
    items: [
      { key: 'orders:read', label: 'View Orders', desc: 'অর্ডার লিস্ট দেখতে পারবে' },
      { key: 'orders:manage', label: 'Manage Orders', desc: 'অর্ডার স্ট্যাটাস ও শিপিং আপডেট' },
    ],
  },
  {
    category: '🏬 Inventory & Stock',
    items: [
      { key: 'inventory:read', label: 'View Stock', desc: 'স্টক সংখ্যা ও ওয়্যারহাউস ভিউ' },
      { key: 'inventory:transfer', label: 'Manage Stock Transfers', desc: 'স্টক ট্রান্সফার ও আপডেট' },
    ],
  },
  {
    category: '⭐ Reviews & Customers',
    items: [
      { key: 'reviews:read', label: 'View Reviews', desc: 'কাস্টমার রিভিউ ভিউ' },
      { key: 'reviews:moderate', label: 'Moderate Reviews', desc: 'রিভিউ এপ্রুভ বা ডিলিট' },
      { key: 'customers:read', label: 'View Customers', desc: 'কাস্টমার লিস্ট ও কার্ট ভিউ' },
    ],
  },
  {
    category: '🎟️ Marketing & Analytics',
    items: [
      { key: 'coupons:read', label: 'View Coupons', desc: 'কুপন দেখতে পারবে' },
      { key: 'coupons:write', label: 'Manage Coupons', desc: 'কুপন তৈরি ও এডিট' },
      { key: 'analytics:read', label: 'View Analytics', desc: 'এনালিটিক্স ও নেট প্রফিট' },
    ],
  },
  {
    category: '⚙️ Settings & Team',
    items: [
      { key: 'settings:read', label: 'View Settings', desc: 'স্টোর সেটিংস দেখতে পারবে' },
      { key: 'settings:write', label: 'Modify Settings', desc: 'স্টোর সেটিংস এডিট' },
      { key: 'staff:manage', label: 'Manage Staff', desc: 'স্টাফ ম্যানেজমেন্ট' },
    ],
  },
  {
    category: '👥 Human Resources',
    items: [
      { key: 'hr:employees:read', label: 'View Employees', desc: 'এমপ্লয়ি ডিরেক্টরি ভিউ' },
      { key: 'hr:employees:manage', label: 'Manage Employees', desc: 'এমপ্লয়ি ও ডিপার্টমেন্ট ম্যানেজমেন্ট' },
      { key: 'hr:attendance:manage', label: 'Manage Attendance', desc: 'অ্যাটেন্ডেন্স ট্র্যাকিং' },
      { key: 'hr:leave:manage', label: 'Approve Leave', desc: 'ছুটির আবেদন এপ্রুভাল' },
      { key: 'hr:leave:self', label: 'Self-Service Leave', desc: 'নিজের ছুটি দেখা ও আবেদন' },
      { key: 'hr:shifts:manage', label: 'Manage Shifts', desc: 'শিফট রোস্টার ম্যানেজমেন্ট' },
      { key: 'hr:expenses:manage', label: 'Manage Expenses', desc: 'খরচ রেকর্ড ম্যানেজমেন্ট' },
      { key: 'hr:payroll:manage', label: 'Manage Payroll', desc: 'পে-রোল ও ট্যাক্স প্রসেসিং' },
      { key: 'hr:notices:manage', label: 'Manage Notice Board', desc: 'নোটিশ পোস্টিং' },
    ],
  },
];

export default function EditStaffPermissionsPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.staffId as string;

  const { data: staffMembers = [] } = useGetStaffMembersQuery();
  const staff = staffMembers.find((s) => s.id === staffId);

  const [role, setRole] = useState<string>('CUSTOM');
  const [permissions, setPermissions] = useState<StaffPermissionType[]>([]);
  const [status, setStatus] = useState<'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED'>('ACTIVE');

  const [updatePermissions, { isLoading, error }] = useUpdateStaffPermissionsMutation();

  useEffect(() => {
    if (staff) {
      setRole(staff.role);
      setPermissions(staff.permissions || []);
      setStatus(staff.status);
    }
  }, [staff]);

  if (!staff) {
    return (
      <div className="max-w-3xl mx-auto my-8 p-8 bg-white rounded-3xl border border-slate-200 text-center">
        <h2 className="text-xl font-bold text-slate-900">Staff Member Not Found</h2>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const togglePermission = (perm: StaffPermissionType) => {
    setRole('CUSTOM');
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePermissions({
        staffId: staff.id,
        role,
        permissions,
        status,
      }).unwrap();
      
      toast.success('Staff permissions updated successfully!');
      router.push('/dashboard/staff');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update staff permissions.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600/30 border border-blue-400/30 rounded-2xl text-blue-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl leading-tight">Edit Staff Permissions</h1>
              <p className="text-sm text-slate-400 mt-1">{staff.name} ({staff.email})</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{(error as any)?.data?.message || 'Failed to update permissions.'}</span>
            </div>
          )}

          {/* Account Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl gap-4">
            <div>
              <label className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                Account Status
              </label>
              <span className="text-xs font-medium text-slate-500">Toggle staff access state</span>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            >
              <option value="ACTIVE">ACTIVE (সক্রিয়)</option>
              <option value="SUSPENDED">SUSPENDED (সাময়িক স্থগিত)</option>
              <option value="PENDING_INVITE">PENDING_INVITE (ইনভাইট বাকি)</option>
            </select>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Role Title</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-5 py-4 border border-slate-300 bg-slate-50 rounded-xl text-base font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white transition-colors"
            >
              {PRESET_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Permissions Matrix ({permissions.length} Enabled)
              </label>
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
                <>Saving Changes...</>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Permissions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
