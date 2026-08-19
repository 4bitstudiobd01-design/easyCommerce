'use client';

import React, { useState } from 'react';
import { X, Store, User, Globe, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { StorePlan, StoreRecord } from './types';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStore: (store: Partial<StoreRecord>) => void;
}

export function AddStoreModal({
  isOpen,
  onClose,
  onAddStore,
}: AddStoreModalProps) {
  const [name, setName] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [plan, setPlan] = useState<StorePlan>('Business');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !merchantEmail.trim()) {
      toast.error('Please enter store name and merchant email');
      return;
    }

    const domain = subdomain.trim()
      ? `${subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')}.easyco.com`
      : `${name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '')}.easyco.com`;

    const initials = name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const colors = [
      'bg-slate-900',
      'bg-rose-400',
      'bg-indigo-400',
      'bg-amber-500',
      'bg-teal-400',
    ];
    const avatarBg = colors[Math.floor(Math.random() * colors.length)];

    onAddStore({
      id: `st-${Date.now()}`,
      codeId: `store_01HBXX${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      initials: initials || 'ST',
      avatarBg,
      merchant: {
        name: merchantName || 'Store Owner',
        email: merchantEmail,
      },
      domain,
      plan,
      status: 'Active',
      country: {
        code: 'BD',
        name: 'Bangladesh',
      },
      orders30d: {
        count: '0',
        trend: '0.0%',
        isPositive: true,
      },
      revenue30d: {
        amount: '৳0',
        trend: '0.0%',
        isPositive: true,
      },
      createdAt: {
        date: 'Aug 14, 2026',
        time: 'Just now',
      },
    });

    toast.success(`Store "${name}" created successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Store</h3>
              <p className="text-xs text-slate-500">
                Create and launch a new storefront tenant
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store Name *
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vintage Leather Co"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subdomain URL
            </label>
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="storename"
                className="w-full pl-9 pr-28 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <span className="absolute right-3 text-xs text-slate-400 font-medium pointer-events-none">
                .easyco.com
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merchant / Owner Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Rahim Hossain"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merchant Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={merchantEmail}
                  onChange={(e) => setMerchantEmail(e.target.value)}
                  placeholder="merchant@domain.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as StorePlan)}
              className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Business">Business</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Create Store</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
