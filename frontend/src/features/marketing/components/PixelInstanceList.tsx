'use client';

import React, { useState } from 'react';
import { Plus, Loader2, Settings2, CircleDot } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useGetPixelsQuery,
  useTestAllPixelsMutation,
  PROVIDER_META,
  type MarketingPixelInstance,
  type PixelProvider,
} from '../api/marketingApi';
import { PixelFormDrawer } from './PixelFormDrawer';

function providerIcon(provider: PixelProvider) {
  switch (provider) {
    case 'META':
      return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-extrabold text-blue-600 font-serif">∞</div>;
    case 'GOOGLE_ANALYTICS':
      return <div className="w-8 h-8 rounded-full bg-amber-100 flex flex-col justify-end items-center px-1 pb-1"><div className="w-full h-1/2 bg-amber-500 rounded-sm" /></div>;
    case 'GOOGLE_ADS':
      return <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-500">G</div>;
    case 'TIKTOK':
      return <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white">d</div>;
  }
}

function relTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(iso).toLocaleDateString();
}

export function PixelInstanceList() {
  const { data: pixels, isLoading } = useGetPixelsQuery();
  const [testAll, { isLoading: isTestingAll }] = useTestAllPixelsMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingPixelInstance | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (p: MarketingPixelInstance) => {
    setEditing(p);
    setDrawerOpen(true);
  };

  const handleTestAll = async () => {
    try {
      const res = await testAll().unwrap();
      toast.success(res.message);
    } catch {
      toast.error('Failed to test pixels.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Tracking Pixels</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Add a pixel per ad platform — the same provider can be added more than once.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestAll}
            disabled={isTestingAll || !pixels?.length}
            className="h-9 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-bold text-xs flex items-center gap-2 disabled:opacity-50"
          >
            {isTestingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CircleDot className="w-3.5 h-3.5" />}
            Test All
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors font-bold text-xs flex items-center gap-2 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            Add Pixel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl w-full" />
          ))}
        </div>
      ) : !pixels || pixels.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-sm font-bold text-slate-700">No pixels yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Add your first tracking pixel to start sending events to Meta, GA4, Google Ads or TikTok.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Pixel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pixels.map((p) => {
            const meta = PROVIDER_META[p.provider];
            const live = p.status === 'CONNECTED' && p.isActive;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between h-[168px]"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {providerIcon(p.provider)}
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">{p.label ?? meta.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{meta.name}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide ${
                        live
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {p.status === 'DISCONNECTED' ? 'Paused' : p.isActive ? 'Live' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <p className="font-bold text-slate-400 mb-0.5">{meta.idLabel}</p>
                      <p className="font-bold text-slate-800 truncate">{p.pixelId}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400 mb-0.5">CAPI</p>
                      <p className="font-bold text-slate-800">
                        {p.capiEnabled ? (p.hasCredentials ? 'On' : 'No creds') : 'Off'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400 mb-0.5">Last event</p>
                      <p className="font-bold text-slate-800">{relTime(p.lastEventAt)}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="h-8 w-full rounded-lg border border-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Configure
                </button>
              </div>
            );
          })}
        </div>
      )}

      <PixelFormDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} pixel={editing} />
    </div>
  );
}
