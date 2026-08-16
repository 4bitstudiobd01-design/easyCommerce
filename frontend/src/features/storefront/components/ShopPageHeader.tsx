'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ShopPageHeaderProps {
  slug?: string;
  totalProducts?: number;
}

export const ShopPageHeader = ({ slug = 'main', totalProducts }: ShopPageHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-slate-50/80 via-white to-blue-50/20 border-b border-slate-200/80 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* LEFT BREADCRUMBS & TITLE */}
          <div className="space-y-2">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Link href={`/store/${slug}`} className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-bold">Shop</span>
            </nav>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                🛍️ Full Collection
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Explore Our Shop
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Discover our curated collection of verified quality products with instant delivery.
            </p>
          </div>

          {/* RIGHT 3D GRAPHIC CUTOUT */}
          <div className="hidden sm:block w-48 lg:w-60 h-24 lg:h-28 rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60 shrink-0">
            <img
              src="/images/storefront/hero-composition.jpg"
              alt="Shop Collection"
              className="w-full h-full object-cover object-right"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
