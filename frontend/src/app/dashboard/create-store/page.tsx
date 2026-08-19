'use client';

import React, { useState, useEffect } from 'react';
import { useCreateStoreMutation } from '@/features/tenant/api/tenantApi';
import { Store, Sparkles, Globe, Phone, MapPin, Tag, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateStorePage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [createStore, { isLoading }] = useCreateStoreMutation();

  // Auto-generate slug from store name
  useEffect(() => {
    if (name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  }, [name, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const newStore = await createStore({
        name,
        slug: slug.toLowerCase().trim(),
        category,
        phone,
        address,
      }).unwrap();

      // Make the newly created store the active one, so the dashboard (and this
      // browser tab) immediately reads/writes this store instead of whichever
      // store x-store-id previously pointed at.
      localStorage.setItem('bitcommerce_active_store_id', newStore.id);

      toast.success('Store created successfully!');
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message || 'Failed to create store. Please try again.'
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        {/* Top Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Digital Store</h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Step 1</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">Setup your multi-tenant eCommerce store in 1 minute</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Store Name
              </label>
              <div className="relative">
                <Store className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Daruchini Fashion"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Subdomain Slug */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Store URL Subdomain
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="daruchini"
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">.bitcommerce.app</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Your storefront web address link</p>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Primary Business Category
              </label>
              <div className="relative">
                <Tag className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                  <option value="Grocery & Superstore">Grocery & Superstore</option>
                  <option value="Health & Beauty">Health & Beauty</option>
                  <option value="General Store">General Store</option>
                </select>
              </div>
            </div>

            {/* Phone & Address Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Store Phone
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801700000000"
                    className="w-full pl-12 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  City / Location
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dhaka, BD"
                    className="w-full pl-12 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 text-lg"
            >
              {isLoading ? (
                <span>Creating Digital Store...</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Launch My Digital Store</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Row-Level Tenant Isolated</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>BDT (৳) Multi-Currency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
