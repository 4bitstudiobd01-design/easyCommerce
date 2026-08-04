'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';
import { CreditCard, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSettingsPage() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const [currency, setCurrency] = useState('BDT');

  useEffect(() => {
    if (store) {
      setCurrency(store.currency || 'BDT');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore({ currency } as any).unwrap();
      toast.success('Payment settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save payment settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <button
        type="button"
        onClick={() => router.push('/dashboard/settings')}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all w-fit"
      >
        <ArrowLeft className="w-4 h-4 text-slate-600" />
        <span>Back to Manage Shop</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Payment Gateway</h3>
            <p className="text-xs text-slate-400">Configure currency and integrated payment methods</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Default Store Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                <option value="USD">USD ($) - US Dollar</option>
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 text-xs">
                  <strong>Note:</strong> Integrations with SSLCommerz, bKash, and Stripe are managed centrally by the platform. You will be notified when self-service gateway configuration becomes available.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Payment Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
