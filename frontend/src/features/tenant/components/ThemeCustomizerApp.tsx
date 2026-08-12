'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Store, useUpdateStoreMutation } from '../api/tenantApi';
import {
  Palette,
  Type,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Globe,
  Sliders,
  Layout,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ThemeCustomizerAppProps {
  store: Store | null;
}

export function ThemeCustomizerApp({ store }: ThemeCustomizerAppProps) {
  const [logo, setLogo] = useState(store?.logo || '');
  const [favicon, setFavicon] = useState((store as any)?.favicon || '');
  const [metaTitle, setMetaTitle] = useState((store as any)?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState((store as any)?.metaDescription || '');

  const [primaryColor, setPrimaryColor] = useState((store as any)?.primaryColor || '#2563eb');
  const [fontFamily, setFontFamily] = useState((store as any)?.fontFamily || 'Inter');

  const [heroBanners, setHeroBanners] = useState<any[]>(
    (store as any)?.heroBanners || [
      {
        id: 'banner-1',
        title: 'New Season Arrival 2026',
        subtitle: 'Discover trending apparel with up to 40% discount',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        ctaText: 'Shop Collection',
        ctaLink: '/store/' + (store?.slug || 'demo'),
      },
    ],
  );

  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImg, setNewBannerImg] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const colorPalettes = [
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Crimson Red', hex: '#dc2626' },
    { name: 'Emerald Green', hex: '#059669' },
    { name: 'Deep Purple', hex: '#7c3aed' },
    { name: 'Sunset Orange', hex: '#ea580c' },
    { name: 'Midnight Dark', hex: '#0f172a' },
  ];

  const fontOptions = ['Inter', 'Outfit', 'Poppins', 'Roboto', 'Hind Siliguri'];

  const handleAddBanner = () => {
    if (!newBannerTitle || !newBannerImg) return;
    const newBanner = {
      id: `banner-${Date.now()}`,
      title: newBannerTitle,
      subtitle: newBannerSubtitle || 'Special Promotional Offer',
      imageUrl: newBannerImg,
      ctaText: 'Explore Now',
      ctaLink: `/store/${store?.slug}`,
    };
    setHeroBanners([...heroBanners, newBanner]);
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerImg('');
  };

  const handleRemoveBanner = (id: string) => {
    setHeroBanners(heroBanners.filter((b) => b.id !== id));
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateStore({
        logo: logo || undefined,
        favicon: favicon || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        primaryColor,
        fontFamily,
        heroBanners,
      } as any).unwrap();

      toast.success('Storefront theme, branding, logo & hero banners saved successfully!');
    } catch (err: any) {
      const message = err?.data?.message || 'Failed to save storefront theme customization.';
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSaveTheme} className="space-y-8 animate-in fade-in duration-200">
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-bold text-xs rounded-2xl">
          {errorMsg}
        </div>
      )}

      {/* 1. BRANDING & SEO ASSETS (Logo, Favicon, Title, Description) */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h4 className="font-extrabold text-sm text-slate-900">Brand Identity & SEO Meta Tags</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Store Logo Image URL</label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Favicon Icon URL (.ico / .png)</label>
            <input
              type="text"
              value={favicon}
              onChange={(e) => setFavicon(e.target.value)}
              placeholder="https://example.com/favicon.png"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">SEO Store Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Sumon Fashion - Premium Online Apparel"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">SEO Meta Tagline / Description</label>
            <input
              type="text"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Shop top quality clothing with fast delivery across BD"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* 2. COLOR PALETTE & TYPOGRAPHY */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Palette className="w-4 h-4 text-purple-600" />
          <h4 className="font-extrabold text-sm text-slate-900">Color Palette & Typography Styling</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold">
          {/* Primary Color Palette Presets */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Store Primary Accent Color</label>
            <div className="grid grid-cols-3 gap-2.5">
              {colorPalettes.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setPrimaryColor(c.hex)}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                    primaryColor === c.hex
                      ? 'bg-white border-blue-600 ring-2 ring-blue-600/20 font-extrabold shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] text-slate-800 truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Typography Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Font Family Typography</label>
            <div className="space-y-2">
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font} Font (Storefront Typography)
                  </option>
                ))}
              </select>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Typography Live Preview:</span>
                <p className="text-sm font-bold text-slate-900 mt-1" style={{ fontFamily }}>
                  The quick brown fox jumps over the lazy dog. ৳1,250 BDT
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HERO SLIDER BANNER MANAGER */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-emerald-600" />
            <h4 className="font-extrabold text-sm text-slate-900">Hero Slider Promotional Banners ({heroBanners.length})</h4>
          </div>
        </div>

        {/* Existing Banners List */}
        <div className="space-y-3">
          {heroBanners.map((banner) => (
            <div
              key={banner.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-16 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                />
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">{banner.title}</span>
                  <span className="text-[11px] text-slate-500">{banner.subtitle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveBanner(banner.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                title="Remove Banner"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Banner Form */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
          <span className="font-bold text-xs text-slate-900 block">Add New Hero Banner Slide</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <input
              type="text"
              placeholder="Banner Title (e.g. Summer Sale 50% Off)"
              value={newBannerTitle}
              onChange={(e) => setNewBannerTitle(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="text"
              placeholder="Subtitle tagline..."
              value={newBannerSubtitle}
              onChange={(e) => setNewBannerSubtitle(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="text"
              placeholder="Image Unsplash URL..."
              value={newBannerImg}
              onChange={(e) => setNewBannerImg(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="button"
            onClick={handleAddBanner}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner Slide</span>
          </button>
        </div>
      </div>

      {/* Save Action Button */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
        {store?.slug && (
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Preview Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
        >
          {isLoading ? (
            <span>Saving Custom Theme...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Theme & Hero Banners</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
