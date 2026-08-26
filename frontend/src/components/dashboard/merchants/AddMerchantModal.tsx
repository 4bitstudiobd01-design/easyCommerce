'use client';

import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, Globe, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { MerchantPlan, MerchantRecord } from './types';

interface AddMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMerchant: (merchant: Partial<MerchantRecord>) => void;
}

export function AddMerchantModal({
  isOpen,
  onClose,
  onAddMerchant,
}: AddMerchantModalProps) {
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [plan, setPlan] = useState<MerchantPlan>('Business');
  const [country, setCountry] = useState('Bangladesh');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in required fields (Merchant name and email)');
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
      'bg-emerald-600',
      'bg-rose-400',
      'bg-indigo-400',
      'bg-amber-500',
      'bg-teal-400',
    ];
    const avatarBg = colors[Math.floor(Math.random() * colors.length)];

    onAddMerchant({
      id: `m-${Date.now()}`,
      name,
      domain,
      initials: initials || 'MC',
      avatarBg,
      contact: {
        email,
        phone: phone || '+8801700000000',
      },
      stores: 1,
      plan,
      status: 'Active',
      joinedAt: {
        date: 'Aug 14, 2026',
        time: 'Just now',
      },
      revenue30d: {
        amount: '৳0',
        trend: '0.0%',
        isPositive: true,
      },
      orders30d: {
        amount: '0',
        trend: '0.0%',
        isPositive: true,
      },
      mrr: plan === 'Business' ? '৳5,000' : plan === 'Growth' ? '৳2,500' : '৳1,000',
      country,
      registrationSource: 'Admin Onboarding',
    });

    toast.success(`Merchant "${name}" onboarded successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Merchant</h3>
              <p className="text-xs text-slate-500">
                Onboard a new merchant organization onto EasyCommerce
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Store / Business Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Merchant / Business Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Footwear Ltd"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store Subdomain
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
            {/* Owner Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner / Contact Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@domain.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+8801..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subscription Plan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as MerchantPlan)}
                className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="Starter">Starter (৳1,000/mo)</option>
                <option value="Growth">Growth (৳2,500/mo)</option>
                <option value="Business">Business (৳5,000/mo)</option>
                <option value="Enterprise">Enterprise (Custom)</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="Bangladesh">Bangladesh</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="UAE">UAE</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Create Merchant</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
