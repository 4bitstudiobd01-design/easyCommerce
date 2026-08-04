'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { Palette, ArrowLeft } from 'lucide-react';
import { ThemeCustomizerApp } from '@/features/tenant/components/ThemeCustomizerApp';

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();

  if (!store) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-200">
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
          <div className="p-2.5 bg-pink-50 text-pink-600 rounded-2xl border border-pink-100">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Theme & Branding</h3>
            <p className="text-xs text-slate-400">Customize accent colors, typography, logos, and banners</p>
          </div>
        </div>

        <ThemeCustomizerApp store={store} />
      </div>
    </div>
  );
}
