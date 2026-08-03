'use client';

import React, { useState } from 'react';
import { StoreThemeItem, Store } from '../api/tenantApi';
import { X, Sparkles, Smartphone, Monitor, CheckCircle2, Zap, Lock, ExternalLink } from 'lucide-react';
import { LuxuryFashionTheme } from '@/features/storefront/themes/LuxuryFashionTheme';
import { TechHubTheme } from '@/features/storefront/themes/TechHubTheme';
import { OrganicGroceryTheme } from '@/features/storefront/themes/OrganicGroceryTheme';
import { MinimalDarkTheme } from '@/features/storefront/themes/MinimalDarkTheme';
import { Product } from '@/features/catalog/api/catalogApi';

interface ThemeLivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: StoreThemeItem | null;
  store?: Store | null;
  onActivate: (theme: StoreThemeItem) => void;
  onUnlock: (theme: StoreThemeItem) => void;
}

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-p1',
    title: 'Premium Wireless Noise-Cancelling Headphones',
    slug: 'demo-headphones',
    description: 'High-fidelity audio with spatial sound, 40-hour battery life, and active noise cancellation.',
    basePrice: 12500,
    images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', isPrimary: true }],
    isPublished: true,
    variants: [],
    tenantId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-p2',
    title: 'Minimalist Minimal Chronograph Watch',
    slug: 'demo-watch',
    description: 'Genuine leather strap, Japanese quartz movement, and 50m water resistance.',
    basePrice: 8900,
    images: [{ id: 'img-2', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', isPrimary: true }],
    isPublished: true,
    variants: [],
    tenantId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-p3',
    title: 'Organic Natural Honey & Organic Staples Set',
    slug: 'demo-honey',
    description: '100% pure raw organic honey harvested from Sundarbans mangrove forest.',
    basePrice: 1450,
    images: [{ id: 'img-3', url: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=800', isPrimary: true }],
    isPublished: true,
    variants: [],
    tenantId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-p4',
    title: 'Designer Silk Blend Evening Dress',
    slug: 'demo-dress',
    description: 'Tailored luxury couture silhouette with gold embroidery accents.',
    basePrice: 16800,
    images: [{ id: 'img-4', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', isPrimary: true }],
    isPublished: true,
    variants: [],
    tenantId: 'demo',
    createdAt: new Date().toISOString(),
  },
];

export const ThemeLivePreviewModal: React.FC<ThemeLivePreviewModalProps> = ({
  isOpen,
  onClose,
  theme,
  store,
  onActivate,
  onUnlock,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen || !theme) return null;

  const storeName = store?.name || 'My Demo Storefront';
  const slug = store?.slug || 'demo';

  const renderThemeLayout = () => {
    const props = {
      storeName,
      slug,
      products: DEMO_PRODUCTS,
      categories: ['All', 'Electronics', 'Fashion', 'Grocery'],
      onSelectProduct: () => {},
      onAddToCart: () => {},
    };

    switch (theme.id) {
      case 'LUXURY_FASHION':
        return <LuxuryFashionTheme {...props} />;
      case 'TECH_HUB':
        return <TechHubTheme {...props} />;
      case 'ORGANIC_GROCERY':
        return <OrganicGroceryTheme {...props} />;
      case 'MINIMAL_DARK':
        return <MinimalDarkTheme {...props} />;
      default:
        return (
          <div className="p-8 text-center bg-slate-900 text-white min-h-screen">
            <h2 className="text-2xl font-bold">{storeName}</h2>
            <p className="text-sm text-slate-400 mt-2">Classic Modern Storefront Layout Preview</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md font-sans">
      {/* Top Preview Control Bar */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base leading-tight">{theme.name}</h3>
              {theme.isFree ? (
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full">
                  FREE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-600 text-white text-[10px] font-black rounded-full">
                  PREMIUM ৳{theme.price.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Live Interactive Layout &amp; Styling Preview</p>
          </div>
        </div>

        {/* Center Device Switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              deviceMode === 'desktop' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              deviceMode === 'mobile' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {theme.isActive ? (
            <span className="px-4 py-2 bg-blue-500/20 text-blue-300 font-extrabold text-xs rounded-xl border border-blue-500/40 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" /> Active Theme
            </span>
          ) : theme.isUnlocked ? (
            <button
              onClick={() => {
                onActivate(theme);
                onClose();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-white text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Zap className="w-4 h-4 text-amber-600" /> Activate Theme
            </button>
          ) : (
            <button
              onClick={() => {
                onUnlock(theme);
                onClose();
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-600/30"
            >
              <Lock className="w-4 h-4" /> Unlock (৳{theme.price.toLocaleString()})
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-y-auto bg-slate-900 p-4 flex justify-center">
        <div
          className={`transition-all duration-300 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ${
            deviceMode === 'mobile' ? 'w-full max-w-sm my-4 border-4 border-slate-800 rounded-3xl' : 'w-full max-w-7xl'
          }`}
        >
          {renderThemeLayout()}
        </div>
      </div>
    </div>
  );
};
