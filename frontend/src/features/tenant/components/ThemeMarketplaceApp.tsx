'use client';

import React, { useState } from 'react';
import {
  useGetAvailableThemesQuery,
  useActivateThemeMutation,
  StoreThemeItem,
  Store,
} from '../api/tenantApi';
import { ThemeUnlockModal } from './ThemeUnlockModal';
import { ThemeLivePreviewModal } from './ThemeLivePreviewModal';
import {
  Palette,
  Sparkles,
  CheckCircle2,
  Lock,
  ExternalLink,
  Zap,
  Tag,
  Sliders,
  Check,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface ThemeMarketplaceAppProps {
  store?: Store | null;
}

export function ThemeMarketplaceApp({ store }: ThemeMarketplaceAppProps) {
  const { data: themeData, isLoading } = useGetAvailableThemesQuery();
  const [activateTheme, { isLoading: isActivating }] = useActivateThemeMutation();

  const [selectedThemeForUnlock, setSelectedThemeForUnlock] = useState<StoreThemeItem | null>(null);
  const [selectedThemeForPreview, setSelectedThemeForPreview] = useState<StoreThemeItem | null>(null);

  const handleActivate = async (theme: StoreThemeItem) => {
    try {
      const res = await activateTheme(theme.id).unwrap();
      toast.success(res.message || `Theme "${theme.name}" activated!`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to activate theme.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-sans">
        Loading Theme Marketplace catalog...
      </div>
    );
  }

  const themes = themeData?.themes || [];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-amber-500/30">
              STOREFRONT THEME ENGINE
            </span>
            <span className="text-xs text-slate-400">1 Free + 4 Premium Themes</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Theme Marketplace &amp; Layout Customizer</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose a visual theme for your online storefront ({store?.name}). 1 Theme is 100% FREE for all merchants; unlock premium themes for lifetime custom branding!
          </p>
        </div>

        <a
          href={`/store/${store?.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition shrink-0"
        >
          <span>Open Active Storefront</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((t) => {
          return (
            <div
              key={t.id}
              className={`bg-white rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                t.isActive
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-xl'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                {/* Image Preview Banner with Live Preview Hover Overlay */}
                <div className="relative h-48 bg-slate-900 overflow-hidden group">
                  <img src={t.previewImage} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  
                  {/* Hover Overlay Button */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center p-4">
                    <button
                      onClick={() => setSelectedThemeForPreview(t)}
                      className="px-4 py-2.5 bg-white text-slate-950 rounded-xl font-extrabold text-xs shadow-2xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition duration-300"
                    >
                      <Eye className="w-4 h-4 text-purple-600" />
                      <span>Live Theme Preview</span>
                    </button>
                  </div>

                  {/* Badge: Free vs Premium */}
                  <div className="absolute top-3 left-3 pointer-events-none">
                    {t.isFree ? (
                      <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                        100% FREE THEME
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
                        <Tag className="w-3 h-3" /> PREMIUM ৳{t.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Active Badge */}
                  {t.isActive && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 pointer-events-none">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE THEME
                    </div>
                  )}
                </div>

                <div className="px-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                      {t.category}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{t.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.description}</p>
                </div>

                {/* Feature Checklist */}
                <div className="px-6 space-y-1.5 pt-2">
                  <span className="text-[11px] font-extrabold text-slate-700 block">Key Features:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {t.features.slice(0, 4).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="p-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => setSelectedThemeForPreview(t)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-600" /> Live Interactive Preview
                </button>

                {t.isActive ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-default border border-blue-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Currently Active Theme
                  </button>
                ) : t.isUnlocked ? (
                  <button
                    onClick={() => handleActivate(t)}
                    disabled={isActivating}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-400" /> Activate Theme
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedThemeForUnlock(t)}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Unlock Theme (৳{t.price.toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Fullscreen Preview Modal */}
      <ThemeLivePreviewModal
        isOpen={!!selectedThemeForPreview}
        onClose={() => setSelectedThemeForPreview(null)}
        theme={selectedThemeForPreview}
        store={store}
        onActivate={(t) => handleActivate(t)}
        onUnlock={(t) => setSelectedThemeForUnlock(t)}
      />

      {/* Theme Unlock Modal */}
      <ThemeUnlockModal
        isOpen={!!selectedThemeForUnlock}
        onClose={() => setSelectedThemeForUnlock(null)}
        theme={selectedThemeForUnlock}
      />
    </div>
  );
}
