'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Square, ExternalLink, Pencil, Eye, Settings } from 'lucide-react';
import { useGetMyStoreQuery, useGetAvailableThemesQuery } from '@/features/tenant/api/tenantApi';
import { Skeleton } from '@/components/ui/Skeleton';

const formatDateTime = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return isToday ? `Today at ${time}` : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`;
};

export function CurrentStorefrontCard() {
  const router = useRouter();
  const { data: store, isLoading } = useGetMyStoreQuery();
  const { data: themeData } = useGetAvailableThemesQuery();

  const activeTheme = themeData?.themes.find((t) => t.id === themeData.activeThemeId);
  const storeUrl = store?.domain || (store?.slug ? `${store.slug}.easyc.app` : '');
  const storefrontHref = store?.slug ? `/store/${store.slug}` : '#';

  if (isLoading || !store) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <Square className="w-4 h-4 text-blue-600 fill-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Current Storefront</h2>
        </div>
        <div className="p-6 flex flex-col xl:flex-row gap-8 items-start">
          <Skeleton className="w-full xl:w-[480px] h-[260px] rounded-xl shrink-0" />
          <div className="flex-1 space-y-4 pt-2 w-full">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <Square className="w-4 h-4 text-blue-600 fill-blue-600" />
        <h2 className="text-sm font-bold text-slate-900">Current Storefront</h2>
      </div>

      <div className="p-6 flex flex-col xl:flex-row gap-8 items-start">
        {/* Left: Mockup Image */}
        <div className="w-full xl:w-[480px] h-[260px] bg-slate-100 rounded-xl border border-slate-200 shrink-0 flex flex-col overflow-hidden relative">
          <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4">
            <span className="text-[10px] font-bold truncate max-w-[120px]">{store.name}</span>
            <div className="flex gap-4 text-[8px] text-slate-500">
              <span>Home</span>
              <span>Shop</span>
              <span>Categories</span>
              <span>About Us</span>
            </div>
            <div className="w-16 h-3 bg-slate-100 rounded-full"></div>
          </div>
          <div className="flex-1 bg-blue-50/50 p-6 flex items-center justify-between">
            <div className="max-w-[200px]">
              <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{store.name}</h3>
              <p className="text-[9px] text-slate-500 mb-4 line-clamp-2">{store.metaDescription || 'Your online storefront, live and ready for customers.'}</p>
              <div className="w-16 h-6 bg-blue-600 rounded text-[8px] text-white flex items-center justify-center font-bold">Shop Now</div>
            </div>
            <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center relative shadow-sm border-4 border-white overflow-hidden">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">{store.name.slice(0, 2).toUpperCase()}</span>
              )}
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-slate-300 rounded shadow-sm border-2 border-white"></div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-slate-300 rounded shadow-sm border-2 border-white"></div>
            </div>
          </div>
        </div>

        {/* Center: Details */}
        <div className="flex-1 flex flex-col gap-6 pt-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-extrabold text-slate-900">{store.name}</h2>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                  store.isActive
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${store.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                {store.isActive ? 'Live' : 'Inactive'}
              </span>
            </div>
            <a
              href={storefrontHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] font-medium text-blue-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {storeUrl}
            </a>
          </div>

          <div className="grid grid-cols-1 gap-y-4">
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 text-[13px] font-bold text-slate-500">Theme</span>
              <div className="col-span-8 flex items-center gap-2">
                <span className="text-[13px] font-bold text-slate-900">{activeTheme?.name || 'Classic Modern Storefront'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Active</span>
              </div>
            </div>
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 text-[13px] font-bold text-slate-500">Last Published</span>
              <span className="col-span-8 text-[13px] font-bold text-slate-900">{formatDateTime(store.updatedAt)}</span>
            </div>
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 text-[13px] font-bold text-slate-500">Store Created</span>
              <span className="col-span-8 text-[13px] font-bold text-slate-900">{formatDateTime(store.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="w-full xl:w-[280px] flex flex-col gap-3 shrink-0 pt-2">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Quick Actions</h3>

          <a
            href={storefrontHref}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors shadow-sm"
          >
            Open Active Storefront
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => router.push('/dashboard/settings/theme')}
            className="h-11 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors"
          >
            <Pencil className="w-4 h-4 text-blue-600" />
            Customize Theme
          </button>

          <a
            href={storefrontHref}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            Preview Storefront
          </a>

          <button
            onClick={() => router.push('/dashboard/settings/general')}
            className="h-11 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            Storefront Settings
          </button>
        </div>
      </div>
    </div>
  );
}
