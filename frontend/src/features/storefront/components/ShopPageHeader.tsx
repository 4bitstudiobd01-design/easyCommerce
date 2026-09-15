'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ShopPageHeaderProps {
  slug?: string;
  totalProducts?: number;
  primaryColor?: string;
}

export const ShopPageHeader = ({ slug = 'main', totalProducts, primaryColor = '#2563eb' }: ShopPageHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-slate-50/80 via-white to-blue-50/20 border-b border-slate-200/80 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* LEFT BREADCRUMBS & TITLE */}
          <div className="space-y-2">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Link
                href={`/store/${slug}`}
                className="transition-colors hover:[color:var(--breadcrumb-hover)]"
                style={{ ['--breadcrumb-hover' as any]: primaryColor }}
              >
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-bold">Shop</span>
            </nav>

            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                style={{ backgroundColor: `${primaryColor}14`, color: primaryColor, border: `1px solid ${primaryColor}33` }}
              >
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
