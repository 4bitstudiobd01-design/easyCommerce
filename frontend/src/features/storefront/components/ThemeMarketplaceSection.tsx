'use client';

import React, { useMemo, useState } from 'react';
import { Store, Search, Eye, CheckCircle2, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAvailableThemesQuery,
  useActivateThemeMutation,
  useGetMyStoreQuery,
  StoreThemeItem,
} from '@/features/tenant/api/tenantApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { ThemeUnlockModal } from '@/features/tenant/components/ThemeUnlockModal';
import { ThemeLivePreviewModal } from '@/features/tenant/components/ThemeLivePreviewModal';

const CARD_COLORS = ['bg-blue-50', 'bg-amber-50', 'bg-rose-50', 'bg-emerald-50', 'bg-violet-50'];

export function ThemeMarketplaceSection() {
  const { data: store } = useGetMyStoreQuery();
  const { data: themeData, isLoading } = useGetAvailableThemesQuery();
  const [activateTheme, { isLoading: isActivating }] = useActivateThemeMutation();

  const [searchInput, setSearchInput] = useState('');
  const [activePill, setActivePill] = useState('All Themes');
  const [selectedForPreview, setSelectedForPreview] = useState<StoreThemeItem | null>(null);
  const [selectedForUnlock, setSelectedForUnlock] = useState<StoreThemeItem | null>(null);

  const themes = themeData?.themes || [];
  const pills = useMemo(
    () => ['All Themes', 'Free', 'Premium', ...Array.from(new Set(themes.map((t) => t.category)))],
    [themes],
  );

  const filteredThemes = useMemo(() => {
    return themes.filter((theme) => {
      if (activePill === 'Free' && !theme.isFree) return false;
      if (activePill === 'Premium' && theme.isFree) return false;
      if (activePill !== 'All Themes' && activePill !== 'Free' && activePill !== 'Premium' && theme.category !== activePill) return false;

      if (searchInput.trim()) {
        const needle = searchInput.trim().toLowerCase();
        if (!theme.name.toLowerCase().includes(needle) && !theme.category.toLowerCase().includes(needle)) return false;
      }

      return true;
    });
  }, [themes, activePill, searchInput]);

  const handleActivate = async (theme: StoreThemeItem) => {
    try {
      const res = await activateTheme(theme.id).unwrap();
      toast.success(res.message || `Theme "${theme.name}" activated!`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to activate theme.');
    }
  };

  const handleAction = (theme: StoreThemeItem) => {
    if (theme.isActive) return;
    if (theme.isUnlocked) {
      handleActivate(theme);
    } else {
      setSelectedForUnlock(theme);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <Store className="w-4 h-4 text-slate-700" />
        <h2 className="text-sm font-bold text-slate-900">Theme Marketplace</h2>
      </div>

      <div className="p-6">
        {/* Filters & Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            {pills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setActivePill(pill)}
                className={`px-4 h-8 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${
                  activePill === pill ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search themes..."
                className="h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Theme Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[340px] rounded-2xl" />
            ))}
          </div>
        ) : filteredThemes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-bold text-slate-900">No themes match these filters</p>
            <p className="text-xs text-slate-500 mt-1">Try a different category or clear your search.</p>
          </div>
        ) : (
          <div className="flex items-center gap-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {filteredThemes.map((theme, idx) => (
                <div key={theme.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                  {/* Image Area */}
                  <div className={`h-[160px] relative ${CARD_COLORS[idx % CARD_COLORS.length]} border-b border-slate-100 overflow-hidden`}>
                    <img
                      src={theme.previewImage}
                      alt={theme.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${theme.isFree ? 'bg-emerald-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'}`}>
                        {theme.isFree ? 'FREE' : 'PREMIUM'}
                      </span>
                    </div>
                    {!theme.isFree && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white text-slate-900 shadow-sm">
                          ৳{theme.price.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {theme.isActive && (
                      <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded self-start mb-2">{theme.category}</span>
                    <h3 className="text-[14px] font-extrabold text-slate-900 mb-1.5 leading-tight">{theme.name}</h3>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-6 line-clamp-2">{theme.description}</p>

                    <div className="mt-auto flex gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedForPreview(theme)}
                        className="flex-1 h-9 rounded-xl border border-slate-200 bg-white text-blue-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Live Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(theme)}
                        disabled={theme.isActive || isActivating}
                        className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-default text-white text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        {theme.isActive ? (
                          'Active'
                        ) : theme.isUnlocked ? (
                          <>
                            <Zap className="w-3.5 h-3.5" /> Use Theme
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" /> Unlock
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ThemeLivePreviewModal
        isOpen={!!selectedForPreview}
        onClose={() => setSelectedForPreview(null)}
        theme={selectedForPreview}
        store={store}
        onActivate={handleActivate}
        onUnlock={(t) => setSelectedForUnlock(t)}
      />

      <ThemeUnlockModal
        isOpen={!!selectedForUnlock}
        onClose={() => setSelectedForUnlock(null)}
        theme={selectedForUnlock}
      />
    </div>
  );
}
