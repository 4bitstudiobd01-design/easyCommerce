'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';
import { Globe, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SeoSettingsPage() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const [facebookPixelId, setFacebookPixelId] = useState('');
  const [facebookCapiToken, setFacebookCapiToken] = useState('');
  const [facebookTestEventCode, setFacebookTestEventCode] = useState('');
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [googleTagManagerId, setGoogleTagManagerId] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [snapchatPixelId, setSnapchatPixelId] = useState('');
  const [pinterestTagId, setPinterestTagId] = useState('');

  useEffect(() => {
    if (store) {
      setFacebookPixelId(store.facebookPixelId || '');
      setFacebookCapiToken(store.facebookCapiToken || '');
      setFacebookTestEventCode(store.facebookTestEventCode || '');
      setTiktokPixelId(store.tiktokPixelId || '');
      setGoogleTagManagerId(store.googleTagManagerId || '');
      setGoogleAnalyticsId((store as any).googleAnalyticsId || '');
      setSnapchatPixelId((store as any).snapchatPixelId || '');
      setPinterestTagId((store as any).pinterestTagId || '');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore({
        facebookPixelId: facebookPixelId || undefined,
        facebookCapiToken: facebookCapiToken || undefined,
        facebookTestEventCode: facebookTestEventCode || undefined,
        tiktokPixelId: tiktokPixelId || undefined,
        googleTagManagerId: googleTagManagerId || undefined,
        googleAnalyticsId: googleAnalyticsId || undefined,
        snapchatPixelId: snapchatPixelId || undefined,
        pinterestTagId: pinterestTagId || undefined,
      } as any).unwrap();
      toast.success('SEO & Marketing API settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save SEO settings.');
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
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">SEO & Marketing Integrations</h3>
            <p className="text-xs text-slate-400">Manage analytics tags and marketing pixels</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
            {/* Google Integrations */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Google Tag Manager ID
              </label>
              <input
                type="text"
                value={googleTagManagerId}
                onChange={(e) => setGoogleTagManagerId(e.target.value)}
                placeholder="GTM-XXXXXXX"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Google Analytics Measurement ID
              </label>
              <input
                type="text"
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Facebook Integrations */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Facebook Pixel ID
              </label>
              <input
                type="text"
                value={facebookPixelId}
                onChange={(e) => setFacebookPixelId(e.target.value)}
                placeholder="Pixel ID..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Facebook CAPI Token
              </label>
              <input
                type="password"
                value={facebookCapiToken}
                onChange={(e) => setFacebookCapiToken(e.target.value)}
                placeholder="Conversion API Token..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Facebook Test Event Code
              </label>
              <input
                type="text"
                value={facebookTestEventCode}
                onChange={(e) => setFacebookTestEventCode(e.target.value)}
                placeholder="TESTXXXXX"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* TikTok Integration */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                TikTok Pixel ID
              </label>
              <input
                type="text"
                value={tiktokPixelId}
                onChange={(e) => setTiktokPixelId(e.target.value)}
                placeholder="TikTok Pixel ID..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Other Integrations */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Snapchat Pixel ID
              </label>
              <input
                type="text"
                value={snapchatPixelId}
                onChange={(e) => setSnapchatPixelId(e.target.value)}
                placeholder="Snapchat Pixel ID..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Pinterest Tag ID
              </label>
              <input
                type="text"
                value={pinterestTagId}
                onChange={(e) => setPinterestTagId(e.target.value)}
                placeholder="Pinterest Tag ID..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Integrations'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
