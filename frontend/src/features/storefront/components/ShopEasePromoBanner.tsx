'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ShopEasePromoBannerProps {
  onShopNowClick?: () => void;
  primaryColor?: string;
}

export const ShopEasePromoBanner = ({ onShopNowClick, primaryColor = '#2563eb' }: ShopEasePromoBannerProps) => {
  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-100/90 via-blue-100/80 to-sky-100/90 p-6 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ border: `1px solid ${primaryColor}33` }}
        >
          {/* LEFT CONTENT */}
          <div className="space-y-3 text-center md:text-left z-10 max-w-xl">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[11px] font-extrabold uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <span>⚡ Limited Time Special</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Special Offer Just For You!
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              Upgrade your shopping experience with up to 30% instant discounts and free nationwide express delivery on selected items.
            </p>
            <div className="pt-2">
              {onShopNowClick ? (
                <button
                  type="button"
                  onClick={onShopNowClick}
                  className="px-5 py-2.5 hover:brightness-110 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition-all group"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -8px ${primaryColor}66` }}
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <Link
                  href="#featured-products"
                  className="px-5 py-2.5 hover:brightness-110 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition-all group"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -8px ${primaryColor}66` }}
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT 3D GIFTBOX GRAPHIC */}
          <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 relative shrink-0 flex items-center justify-center">
            <img
              src="/images/storefront/promo-giftbox.jpg"
              alt="Special Offer Gift Box"
              className="w-full h-full object-contain drop-shadow-xl transform hover:scale-105 transition-transform duration-300 rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
