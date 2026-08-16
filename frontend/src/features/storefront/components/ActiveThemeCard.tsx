'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Square, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAvailableThemesQuery, useGetMyStoreQuery, useActivateThemeMutation, StoreThemeItem } from '@/features/tenant/api/tenantApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { ThemeLivePreviewModal } from '@/features/tenant/components/ThemeLivePreviewModal';
import { ThemeUnlockModal } from '@/features/tenant/components/ThemeUnlockModal';

export function ActiveThemeCard() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const { data: themeData, isLoading } = useGetAvailableThemesQuery();
  const [activateTheme] = useActivateThemeMutation();
  const [showPreview, setShowPreview] = useState(false);
  const [themeToUnlock, setThemeToUnlock] = useState<StoreThemeItem | null>(null);

  const handleActivate = async (theme: StoreThemeItem) => {
    try {
      const res = await activateTheme(theme.id).unwrap();
      toast.success(res.message || `Theme "${theme.name}" activated!`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to activate theme.');
    }
  };

  const activeTheme = themeData?.themes.find((t) => t.id === themeData.activeThemeId);
  const features = activeTheme?.features || [];
  const features1 = features.slice(0, Math.ceil(features.length / 2));
  const features2 = features.slice(Math.ceil(features.length / 2));

  if (isLoading || !activeTheme) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <Square className="w-4 h-4 text-blue-600 fill-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Active Theme</h2>
        </div>
        <div className="p-6 flex gap-6 items-center">
          <Skeleton className="w-[200px] h-[120px] rounded-xl shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <Square className="w-4 h-4 text-blue-600 fill-blue-600" />
        <h2 className="text-sm font-bold text-slate-900">Active Theme</h2>
      </div>

      <div className="p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
        {/* Left: Mini Preview */}
        <div className="w-[200px] h-[120px] bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-hidden relative">
          <img src={activeTheme.previewImage} alt={activeTheme.name} className="w-full h-full object-cover" />
        </div>

        {/* Center: Details & Checklist */}
        <div className="flex-1 flex flex-col xl:flex-row gap-8">
          <div className="flex-1 max-w-[320px]">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">{activeTheme.name}</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-3">
              <span>{activeTheme.category}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>{activeTheme.isFree ? 'Free' : `৳${activeTheme.price.toLocaleString()}`}</span>
            </div>
            <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
              {activeTheme.description}
            </p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-2.5 justify-center">
              {features1.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-[12px] font-bold text-slate-700">{f}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 justify-center">
              {features2.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-[12px] font-bold text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-full xl:w-auto flex flex-col gap-3 shrink-0 pt-2 xl:pt-0">
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard/settings/theme')}
              className="flex-1 xl:w-[120px] h-10 bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors"
            >
              Customize
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 xl:w-[100px] h-10 bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors"
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      <ThemeLivePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        theme={activeTheme}
        store={store}
        onActivate={handleActivate}
        onUnlock={(t) => {
          setShowPreview(false);
          setThemeToUnlock(t);
        }}
      />

      <ThemeUnlockModal
        isOpen={!!themeToUnlock}
        onClose={() => setThemeToUnlock(null)}
        theme={themeToUnlock}
      />
    </div>
  );
}
