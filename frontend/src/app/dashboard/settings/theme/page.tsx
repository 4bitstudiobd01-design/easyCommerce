'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { Palette, ArrowLeft, Monitor, ExternalLink } from 'lucide-react';
import Link from 'next/link';
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

      {/* Header with live preview teaser */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-blue-100 via-purple-100 to-transparent opacity-60 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-pink-500/25">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">Theme & Branding</h1>
              <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5">
                Customize your storefront&apos;s appearance, branding, and promotional content.
              </p>
            </div>
          </div>

          {store?.slug && (
            <Link
              href={`/store/${store.slug}`}
              target="_blank"
              className="group flex items-center gap-3 pl-3 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all shrink-0"
            >
              <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm shrink-0">
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-[11px] font-extrabold text-slate-800">Live Store Preview</span>
                <span className="block text-[10.5px] text-slate-400 font-medium">See changes on your live store</span>
                <span className="flex items-center gap-1 text-[10.5px] font-bold text-blue-600 group-hover:underline mt-0.5">
                  Preview Storefront
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>

      <ThemeCustomizerApp store={store} />
    </div>
  );
}
