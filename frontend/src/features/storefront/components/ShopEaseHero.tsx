'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
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
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30 py-10 md:py-16 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
            {/* Attractive Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>New Season Arrival • Save up to 50% Off</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                Welcome to
              </h2>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
                <span className="text-slate-900">Shop</span>
                <span className="text-blue-600">Ease</span>
              </h1>
            </div>

            <p className="text-slate-600 text-sm sm:text-base font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Discover thousands of premium products at unbeatable prices. Shop your favorites and enjoy authentic quality with fast doorstep delivery!
            </p>

            <div className="pt-2">
              {onShopNowClick ? (
                <button
                  type="button"
                  onClick={onShopNowClick}
                  className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 inline-flex items-center gap-2.5 transition-all group"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <Link
                  href="#featured-products"
                  className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 inline-flex items-center gap-2.5 transition-all group"
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
