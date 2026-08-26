'use client';

import React, { useState } from 'react';
import { X, CreditCard, Store, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BillingCycle, SubscriptionPlan, SubscriptionRecord } from './types';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSub: (sub: Partial<SubscriptionRecord>) => void;
}

export function AddSubscriptionModal({
  isOpen,
  onClose,
  onAddSub,
}: AddSubscriptionModalProps) {
  const [storeName, setStoreName] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [plan, setPlan] = useState<SubscriptionPlan>('Business');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !merchantName.trim()) {
      toast.error('Please enter store and merchant details');
      return;
    }

    const domain = subdomain.trim()
      ? `${subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')}.easyco.com`
      : `${storeName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '')}.easyco.com`;

    const initials = storeName
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const mrr = plan === 'Business' ? '৳5,000' : plan === 'Growth' ? '৳2,500' : '৳1,000';
    const amount = billingCycle === 'Annual'
      ? plan === 'Business' ? '৳60,000' : plan === 'Growth' ? '৳30,000' : '৳12,000'
      : mrr;

    onAddSub({
      id: `sub-${Date.now()}`,
      codeId: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      initials: initials || 'SB',
      avatarBg: 'bg-emerald-600',
      domain,
      storeName,
      merchantName,
      plan,
      status: 'Active',
      billingCycle,
      nextBillingDate: {
        date: billingCycle === 'Annual' ? 'Aug 20, 2027' : 'Sep 20, 2026',
        subtext: billingCycle === 'Annual' ? 'in 365 days' : 'in 30 days',
      },
      mrr,
      amount,
    });

    toast.success(`Subscription created for "${storeName}"!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Subscription</h3>
              <p className="text-xs text-slate-500">
                Create or assign a subscription plan to a store
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
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Trendy Crafts"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Merchant Owner Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g. Shakil Mahmud"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan Tier
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}
                className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="Starter">Starter (৳1,000/mo)</option>
                <option value="Growth">Growth (৳2,500/mo)</option>
                <option value="Business">Business (৳5,000/mo)</option>
                <option value="Enterprise">Enterprise (Custom)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual (Save 10%)</option>
              </select>
            </div>
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
              <span>Create Subscription</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
