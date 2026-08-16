'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useGetMyStoreQuery, useDeleteMyStoreMutation } from '@/features/tenant/api/tenantApi';

export default function DeleteStorePage() {
  const router = useRouter();
  const { data: store, isLoading } = useGetMyStoreQuery();
  const [deleteStore, { isLoading: isDeleting }] = useDeleteMyStoreMutation();

  const [confirmStoreName, setConfirmStoreName] = useState('');
  const [password, setPassword] = useState('');

  const nameMatches = !!store && confirmStoreName.trim() === store.name.trim();
  const canSubmit = nameMatches && password.length > 0 && !isDeleting;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const res = await deleteStore({ password, confirmStoreName: confirmStoreName.trim() }).unwrap();
      toast.success(res.message || 'Store closed.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to close store.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
      </div>
    );
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all';

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12 animate-in fade-in duration-200">
      <button
        type="button"
        onClick={() => router.push('/dashboard/settings')}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Store Settings</span>
      </button>

      <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
        <div className="px-7 py-6 border-b border-red-100 bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-tight">
                Delete Store
              </h1>
              <p className="text-[12.5px] font-medium text-slate-500 mt-1 leading-relaxed">
                Permanently close <span className="font-bold text-slate-700">{store?.name}</span> and take it offline.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleDelete} className="p-7 space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-[12.5px] font-extrabold text-red-900">This action cannot be undone</p>
                <ul className="text-[11.5px] font-medium text-red-700 space-y-1 list-disc list-inside">
                  <li>Your storefront goes offline immediately and customers can no longer order.</li>
                  <li>Your store address <span className="font-mono">{store?.slug}</span> is released and may be claimed by someone else.</li>
                  <li>Order and payment records are retained for financial and legal compliance.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11.5px] font-bold text-slate-700">
              Type the store name <span className="font-mono text-red-600">{store?.name}</span> to confirm
            </label>
            <input
              value={confirmStoreName}
              onChange={(e) => setConfirmStoreName(e.target.value)}
              placeholder={store?.name}
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11.5px] font-bold text-slate-700">Confirm your account password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              autoComplete="current-password"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/settings')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12.5px] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[12.5px] rounded-xl shadow-sm shadow-red-600/25 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>{isDeleting ? 'Closing store...' : 'Permanently Close Store'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
