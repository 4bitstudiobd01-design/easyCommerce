'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sliders, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';

export default function LimitsSettingsPage() {
  const router = useRouter();
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();

  const [formData, setFormData] = useState({
    maxCodOrdersPerIp: 0,
    maxOrdersPerDay: 0,
  });

  useEffect(() => {
    if (store) {
      setFormData({
        maxCodOrdersPerIp: store.maxCodOrdersPerIp || 0,
        maxOrdersPerDay: store.maxOrdersPerDay || 0,
      });
    }
  }, [store]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: isNaN(val) ? 0 : Math.max(0, val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      await updateStore({
        maxCodOrdersPerIp: formData.maxCodOrdersPerIp,
        maxOrdersPerDay: formData.maxOrdersPerDay,
      }).unwrap();
      toast.success('Order limits updated successfully.');
    } catch (error) {
      toast.error('Failed to update limits.');
    }
  };

  if (isStoreLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

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

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Order & Fraud Limits</h2>
          </div>
          <p className="text-xs text-slate-500">
            Configure system limits to automatically prevent spam orders and abuse. Set to 0 to disable a limit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Max COD Orders Per IP (Daily)</label>
            <input
              type="number"
              name="maxCodOrdersPerIp"
              value={formData.maxCodOrdersPerIp}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
            <p className="text-[10px] text-slate-400">Restricts Cash-on-Delivery orders from the same IP address.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Max Global Orders Per Day</label>
            <input
              type="number"
              name="maxOrdersPerDay"
              value={formData.maxOrdersPerDay}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
            <p className="text-[10px] text-slate-400">Automatically marks items as out of stock once daily limit hits.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isUpdating ? 'Saving Limits...' : 'Save Limits'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
