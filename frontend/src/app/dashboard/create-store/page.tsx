'use client';

import React, { useState, useEffect } from 'react';
import { useCreateStoreMutation } from '@/features/tenant/api/tenantApi';
import { toast } from 'sonner';

const CATEGORIES = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Grocery & Superstore',
  'Health & Beauty',
  'General Store',
];

export default function CreateStorePage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState('Fashion & Apparel');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [createStore, { isLoading }] = useCreateStoreMutation();

  // The subdomain tracks the store name until the merchant customizes it directly.
  useEffect(() => {
    if (!slugEdited) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  }, [name, slugEdited]);

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

  const fieldClass =
    'w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-colors';
  const labelClass = 'block text-[12.5px] font-bold text-slate-700 mb-1.5';

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-10">
      <div className="text-center mb-6">
        <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full uppercase tracking-wide mb-3">
          Last step
        </div>
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Launch your store</h1>
        <p className="text-[13px] font-medium text-slate-500 mt-1">Takes about a minute — you can change everything later.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
        {errorMsg && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Store Name */}
          <div>
            <label htmlFor="storeName" className={labelClass}>Store Name</label>
            <input
              id="storeName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daruchini Fashion"
              className={fieldClass}
            />
          </div>

          {/* Subdomain Slug with live preview */}
          <div>
            <label htmlFor="storeSlug" className={labelClass}>Store Web Address</label>
            <input
              id="storeSlug"
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              placeholder="daruchini"
              className={`${fieldClass} font-semibold`}
            />
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50/60 border border-blue-100 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-[12px] font-bold text-blue-700 truncate">
                {slug || 'yourstore'}<span className="text-blue-400 font-medium">.bitcommerce.app</span>
              </p>
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className={labelClass}>Primary Business Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((value) => {
                const isSelected = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    aria-pressed={isSelected}
                    className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="storePhone" className={labelClass}>Store Phone</label>
              <input
                id="storePhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801700000000"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="storeAddress" className={labelClass}>City / Location</label>
              <input
                id="storeAddress"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dhaka, BD"
                className={fieldClass}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors text-[14px] shadow-md shadow-blue-600/20 disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? 'Creating your store...' : 'Launch My Store'}
          </button>
        </form>

        {/* Trust badges */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-5 text-[11px] text-slate-500 font-bold">
          <span className="text-emerald-600">Tenant Isolated</span>
          <span className="text-blue-600">BDT (৳) Ready</span>
        </div>
      </div>
    </div>
  );
}
