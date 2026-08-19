'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { HeroBanner, Store, useUpdateStoreMutation } from '../api/tenantApi';
import { ImageInputWithUpload } from './ImageInputWithUpload';
import {
  Palette,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Layout,
  ImagePlus,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ThemeCustomizerAppProps {
  store: Store | null;
}

export function ThemeCustomizerApp({ store }: ThemeCustomizerAppProps) {
  const [logo, setLogo] = useState(store?.logo || '');
  const [favicon, setFavicon] = useState(store?.favicon || '');
  const [metaTitle, setMetaTitle] = useState(store?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(store?.metaDescription || '');

  const [primaryColor, setPrimaryColor] = useState(store?.primaryColor || '#2563eb');
  const [fontFamily, setFontFamily] = useState(store?.fontFamily || 'Inter');

  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(store?.heroBanners || []);

  const [newBannerImg, setNewBannerImg] = useState('');
  const [newBannerCtaText, setNewBannerCtaText] = useState('');
  const [newBannerCtaLink, setNewBannerCtaLink] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
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
    if (!newBannerImg) return;
    const newBanner: HeroBanner = {
      id: `banner-${Date.now()}`,
      imageUrl: newBannerImg,
      ctaText: newBannerCtaText.trim() || 'Shop Now',
      ctaLink: newBannerCtaLink.trim() || `/store/${store?.slug}`,
    };
    setHeroBanners([...heroBanners, newBanner]);
    setNewBannerImg('');
    setNewBannerCtaText('');
    setNewBannerCtaLink('');
  };

  const handleRemoveBanner = (id: string) => {
    setHeroBanners(heroBanners.filter((b) => b.id !== id));
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await updateStore({
        logo: logo || undefined,
        favicon: favicon || undefined,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        primaryColor,
        fontFamily,
        heroBanners,
      }).unwrap();

      toast.success('Storefront theme, branding, logo & hero banners saved successfully!');
      router.push('/dashboard/settings');
    } catch (err: any) {
      const message = err?.data?.message || 'Failed to save storefront theme customization.';
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSaveTheme} className="space-y-6 animate-in fade-in duration-200">
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-bold text-xs rounded-2xl">
          {errorMsg}
        </div>
      )}

      {/* 1. BRANDING & SEO ASSETS (Logo, Favicon, Title, Description) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">Brand Identity & SEO Meta Tags</h4>
            <p className="text-[11.5px] text-slate-400 font-medium">Define your brand identity and improve your store&apos;s search visibility.</p>
          </div>
        </div>

        {/* Dual Mode Upload & Link for Logo & Favicon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ImageInputWithUpload
            label="Store Logo"
            value={logo}
            onChange={(url) => setLogo(url)}
            placeholder="https://example.com/logo.png"
            description="Upload or paste image link (PNG with transparent background recommended)"
            previewShape="square"
            fileableType="STORE_LOGO"
          />

          <ImageInputWithUpload
            label="Favicon Icon"
            value={favicon}
            onChange={(url) => setFavicon(url)}
            placeholder="https://example.com/favicon.png"
            description="Browser tab icon (Square 1:1 format, .ico or .png)"
            previewShape="icon"
            fileableType="STORE_FAVICON"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">SEO Store Title</label>
              <span className="text-[10px] text-slate-400 font-medium">{metaTitle.length}/70</span>
            </div>
            <input
              type="text"
              value={metaTitle}
              maxLength={70}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Sumon Fashion - Premium Online Apparel"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors"
            />
            <p className="text-[10.5px] text-slate-400 font-medium mt-1">This title will appear in search engine results.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">SEO Meta Tagline / Description</label>
              <span className="text-[10px] text-slate-400 font-medium">{metaDescription.length}/160</span>
            </div>
            <input
              type="text"
              value={metaDescription}
              maxLength={160}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Shop top quality clothing with fast delivery across BD"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors"
            />
            <p className="text-[10.5px] text-slate-400 font-medium mt-1">This description helps search engines understand your store.</p>
          </div>
        </div>
      </div>

      {/* 2. COLOR PALETTE & TYPOGRAPHY */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">Color Palette & Typography Styling</h4>
            <p className="text-[11.5px] text-slate-400 font-medium">Select colors and fonts that match your brand personality.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs font-semibold">
          {/* Primary Color Palette Presets */}
          <div>
            <label className="block font-bold text-slate-700 mb-2.5">Primary Accent Color</label>
            <div className="grid grid-cols-2 gap-2.5">
              {colorPalettes.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setPrimaryColor(c.hex)}
                  className={`relative p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    primaryColor === c.hex
                      ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/15 font-extrabold'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-black/5 shadow-sm shrink-0" style={{ backgroundColor: c.hex }} />
                  <span className="text-[11px] text-slate-800 truncate">{c.name}</span>
                  {primaryColor === c.hex && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <svg viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Typography Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-2.5">Typography</label>
            <div className="space-y-2.5">
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font} (Storefront Typography)
                  </option>
                ))}
              </select>

              <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-blue-600 font-extrabold block uppercase tracking-wide">Live Preview</span>
                <p className="text-sm font-bold text-slate-900 mt-1.5 leading-snug" style={{ fontFamily }}>
                  The quick brown fox jumps over the lazy dog. ৳1,250 BDT
                </p>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1">
                Typography preview may differ slightly on your storefront.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HERO SLIDER BANNER MANAGER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shrink-0">
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Hero Slider Promotional Banners ({heroBanners.length})</h4>
              <p className="text-[11.5px] text-slate-400 font-medium">Add eye-catching hero banners to highlight offers and promotions.</p>
            </div>
          </div>
        </div>

        {/* Existing Banners List */}
        {heroBanners.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-2">
              <ImagePlus className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-600">No hero banner slides added yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Add your first banner to make your storefront more engaging.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {heroBanners.map((banner) => (
              <div
                key={banner.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={banner.imageUrl}
                    alt="Hero banner"
                    className="w-20 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-extrabold text-slate-900 text-xs block truncate">
                      Button: {banner.ctaText || 'Shop Now'}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block font-mono">{banner.ctaLink}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveBanner(banner.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0 self-end sm:self-auto"
                  title="Remove Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Banner Form */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-4">
          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5 text-slate-500" />
            Add New Hero Banner Slide
          </span>

          <ImageInputWithUpload
            label="Banner Image"
            value={newBannerImg}
            onChange={(url) => setNewBannerImg(url)}
            placeholder="https://images.unsplash.com/photo-..."
            description="Upload banner file or paste image URL (Recommended: Wide 1200x500px)"
            previewShape="banner"
            fileableType="STORE_BANNER"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input
              type="text"
              placeholder="Button text (e.g. Shop Now)"
              value={newBannerCtaText}
              onChange={(e) => setNewBannerCtaText(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            />
            <input
              type="text"
              placeholder="Button link (e.g. /store/your-shop)"
              value={newBannerCtaLink}
              onChange={(e) => setNewBannerCtaLink(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleAddBanner}
            disabled={!newBannerImg}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="sticky bottom-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg shadow-slate-900/5 px-5 py-3.5 flex items-center justify-between gap-4">
        {store?.slug ? (
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Preview Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
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
