'use client';

import React, { useState, useEffect } from 'react';
import { StaffMember, useUpdateStaffPermissionsMutation, StaffPermissionType } from '../api/staffApi';
import { X, Shield, Save, AlertCircle, Sparkles } from 'lucide-react';

interface EditStaffPermissionsModalProps {
  isOpen: boolean;
  staff: StaffMember | null;
  onClose: () => void;
}

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
];

export const EditStaffPermissionsModal: React.FC<EditStaffPermissionsModalProps> = ({
  isOpen,
  staff,
  onClose,
}) => {
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

  if (!isOpen || !staff) return null;

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
      onClose();
    } catch (err) {
      console.error('Failed to update staff permissions:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Edit Staff Permissions ({staff.name})</h3>
              <p className="text-xs text-slate-400">{staff.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{(error as any)?.data?.message || 'Failed to update permissions.'}</span>
            </div>
          )}

          {/* Account Status */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Account Status
              </label>
              <span className="text-xs text-slate-500">Toggle staff access state</span>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE (সক্রিয়)</option>
              <option value="SUSPENDED">SUSPENDED (সাময়িক স্থগিত)</option>
              <option value="PENDING_INVITE">PENDING_INVITE (ইনভাইট বাকি)</option>
            </select>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {PRESET_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                Permissions Matrix ({permissions.length} Enabled)
              </label>
            </div>

            <div className="space-y-4">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.category} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5">
                  <h6 className="text-xs font-semibold text-slate-800 mb-2">{group.category}</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const isChecked = permissions.includes(item.key);
                      return (
                        <label
                          key={item.key}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-white border-blue-300 shadow-sm'
                              : 'bg-transparent border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(item.key)}
                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{item.label}</div>
                            <div className="text-[10px] text-slate-500 leading-tight">{item.desc}</div>
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Permissions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
