'use client';

import React from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

interface ShopEaseHeroProps {
  storeName?: string;
  onShopNowClick?: () => void;
}

export const ShopEaseHero = ({
  storeName = 'ShopEase',
  onShopNowClick,
}: ShopEaseHeroProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-slate-50/20 py-3 sm:py-6 lg:py-16 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* =======================================================================
            1. ULTRA-MODERN SLEEK MOBILE HERO (FLOATING FROSTED GLASS DOCK ON BRIGHT 3D IMAGE)
        ======================================================================= */}
        <div className="lg:hidden relative rounded-3xl overflow-hidden h-[430px] sm:h-[480px] bg-slate-100 border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.08)] group">
          {/* Crisp, Vibrant 3D Hero Background Image */}
          <img
            src="/images/storefront/hero-composition.jpg"
            alt="ShopEase 3D Shopping Cart"
            className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
          />

          {/* Floating Top Pill Badge */}
          <div className="absolute top-3.5 left-3.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/90 text-blue-700 text-[10px] font-black shadow-md shadow-slate-900/5">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Save up to 50% Off</span>
            </div>
          </div>

          {/* Floating Frosted Glass Action Card at Bottom */}
          <div className="absolute bottom-3 inset-x-3 z-10 bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/95 shadow-[0_15px_35px_rgba(0,0,0,0.12)] space-y-2">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Welcome to
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
                <span>Shop</span>
                <span className="text-blue-600">Ease</span>
              </h1>
            </div>

            <p className="text-slate-600 text-xs font-medium line-clamp-2 leading-relaxed">
              Discover thousands of premium products at unbeatable prices with fast doorstep delivery!
            </p>

            {/* Bottom Action Row */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100/80">
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                <span>Instant Delivery</span>
              </div>

              {onShopNowClick ? (
                <button
                  type="button"
                  onClick={onShopNowClick}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href="#featured-products"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* =======================================================================
            2. DESKTOP VIEW (CLASSIC 2-COLUMN SIDE-BY-SIDE HERO LAYOUT)
        ======================================================================= */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 items-center">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-6 space-y-5 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>New Season Arrival • Save up to 50% Off</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                Welcome to
              </h2>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
                <span className="text-slate-900">Shop</span>
                <span className="text-blue-600">Ease</span>
              </h1>
            </div>

            <p className="text-slate-600 text-base font-medium max-w-lg leading-relaxed">
              Discover thousands of premium products at unbeatable prices. Shop your favorites and enjoy authentic quality with fast doorstep delivery!
            </p>

            <div className="pt-2">
              {onShopNowClick ? (
                <button
                  type="button"
                  onClick={onShopNowClick}
                  className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 inline-flex items-center gap-2.5 transition-all group cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <Link
                  href="#featured-products"
                  className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 inline-flex items-center gap-2.5 transition-all group cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT 3D COMPOSITION GRAPHIC */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow">
              <img
                src="/images/storefront/hero-composition.jpg"
                alt="ShopEase 3D Shopping Cart & Display"
                className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
