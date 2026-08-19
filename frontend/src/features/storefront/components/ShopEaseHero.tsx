'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

export interface HeroBannerSlide {
  id: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
}

interface ShopEaseHeroProps {
  storeName?: string;
  onShopNowClick?: () => void;
  primaryColor?: string;
  banners?: HeroBannerSlide[];
}

const AUTO_ROTATE_MS = 6000;

export const ShopEaseHero = ({
  storeName = 'ShopEase',
  onShopNowClick,
  primaryColor,
  banners = [],
}: ShopEaseHeroProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const hasCustomBanners = banners.length > 0;

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setActiveSlide((i) => (i + 1) % banners.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (hasCustomBanners) {
    const slide = banners[activeSlide % banners.length];
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-slate-50/30 py-4 sm:py-8 lg:py-10 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="group relative w-full h-[300px] sm:h-[400px] lg:h-[460px] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={slide.id}
              src={slide.imageUrl}
              alt={storeName}
              className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-500 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10 flex justify-center sm:justify-start">
              <Link
                href={slide.ctaLink || '#featured-products'}
                className="px-6 py-3 sm:px-7 sm:py-3.5 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg inline-flex items-center gap-2 transition-all active:scale-95 hover:brightness-110"
                style={{ backgroundColor: primaryColor || '#2563eb' }}
              >
                <span>{slide.ctaText || 'Shop Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {banners.length > 1 && (
              <div className="absolute bottom-5 right-5 sm:right-8 flex items-center gap-1.5">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-label={`Show slide ${i + 1}`}
                    onClick={() => setActiveSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeSlide % banners.length ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-slate-50/30 py-6 sm:py-10 lg:py-16 border-b border-slate-100">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* =======================================================================
            1. ULTRA-MODERN SLEEK MOBILE HERO
        ======================================================================= */}
        <div className="lg:hidden relative rounded-3xl overflow-hidden h-[440px] sm:h-[490px] bg-slate-100 border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.08)] group">
          <img
            src="/images/storefront/hero-composition.jpg"
            alt={storeName}
            className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
          />

          {/* Floating Top Pill Badge */}
          <div className="absolute top-3.5 left-3.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-white text-blue-700 text-[10px] font-black shadow-md shadow-slate-900/5">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Official Storefront</span>
            </div>
          </div>

          {/* Floating Frosted Glass Action Card at Bottom */}
          <div className="absolute bottom-3 inset-x-3 z-10 bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/95 shadow-[0_15px_35px_rgba(0,0,0,0.12)] space-y-2.5">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                Welcome to
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
                <span>{storeName}</span>
              </h1>
            </div>

            <p className="text-slate-600 text-xs font-medium line-clamp-2 leading-relaxed">
              Discover our verified collection of authentic items with fast doorstep delivery!
            </p>

            {/* Bottom Action Row */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100/80">
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600">
                <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                <span>Instant Delivery</span>
              </div>

              {onShopNowClick ? (
                <button
                  type="button"
                  onClick={onShopNowClick}
                  className="px-5 py-2.5 bg-blue-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/25 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href="#featured-products"
                  className="px-5 py-2.5 bg-blue-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/25 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* =======================================================================
            2. DESKTOP VIEW (CLASSIC 2-COLUMN LUXURY HERO)
        ======================================================================= */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 items-center">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span>Verified Store • Official Partner</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-500 tracking-tight">
                Welcome to
              </h2>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
                {storeName}
              </h1>
            </div>

            <p className="text-slate-600 text-base font-medium max-w-lg leading-relaxed">
              Explore our handpicked collection of quality products at unbeatable prices. Enjoy hassle-free ordering and fast nationwide delivery to your doorstep.
            </p>

            {/* Trust highlights */}
            <div className="flex items-center gap-6 text-xs font-bold text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px]">
                  ✓
                </div>
                <span>100% Genuine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                  ⚡
                </div>
                <span>Fast Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-[10px]">
                  🛡️
                </div>
                <span>Secure Checkout</span>
              </div>
            </div>

            <div className="pt-2">
              {onShopNowClick ? (
                <button
                  type="button"
                  onClick={onShopNowClick}
                  className="px-8 py-3.5 bg-blue-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/25 inline-flex items-center gap-2.5 transition-all group cursor-pointer"
                  style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <Link
                  href="#featured-products"
                  className="px-8 py-3.5 bg-blue-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/25 inline-flex items-center gap-2.5 transition-all group cursor-pointer"
                  style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT 3D COMPOSITION GRAPHIC */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white p-2">
              <img
                src="/images/storefront/hero-composition.jpg"
                alt={storeName}
                className="w-full h-auto rounded-2xl object-cover transform hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
