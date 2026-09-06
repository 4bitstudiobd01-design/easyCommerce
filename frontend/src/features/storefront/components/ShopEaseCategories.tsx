'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface ShopEaseCategoryItem {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  itemCount?: number | string;
}

interface ShopEaseCategoriesProps {
  categories?: ShopEaseCategoryItem[];
  selectedCategory?: string;
  storeSlug?: string;
  primaryColor?: string;
  onSelectCategory?: (category: string) => void;
}

// Curated chic pastel color themes matching the reference mockup
const PASTEL_COLOR_PALETTES = [
  { bg: '#FAF3EA', border: '#F2E7DC', hoverBg: '#F5ECE0' }, // Warm sand / peach
  { bg: '#FFF3E8', border: '#FBE7D4', hoverBg: '#FEEAD7' }, // Soft cream / melon
  { bg: '#EBF5F1', border: '#DCEFE8', hoverBg: '#E0EFE9' }, // Light mint / sage
  { bg: '#FCEEF1', border: '#F8DEE4', hoverBg: '#F7E1E6' }, // Soft blush pink
  { bg: '#F7EEED', border: '#EFE0DF', hoverBg: '#EEE1DF' }, // Soft warm mauve / taupe
  { bg: '#EEF4FB', border: '#DCE7F5', hoverBg: '#E2ECF7' }, // Powder sky blue
  { bg: '#FEF9EC', border: '#FBEECB', hoverBg: '#FDF1D5' }, // Soft butter cream
  { bg: '#F3EEFA', border: '#E6DCF5', hoverBg: '#E8DEF3' }, // Soft lavender
];

export const ShopEaseCategories: React.FC<ShopEaseCategoriesProps> = ({
  categories = [],
  selectedCategory = 'ALL',
  storeSlug = 'main',
  primaryColor = '#E05353',
  onSelectCategory,
}) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="py-10 sm:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER: Title on left, "View All Categories ->" on right */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Shop by Category
            </h2>
          </div>

          <Link
            href={`/store/${storeSlug}/categories`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all duration-200 group cursor-pointer hover:gap-2"
            style={{ color: primaryColor || '#E05353' }}
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* CATEGORIES GRID: Horizontal pastel cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
          {categories.map((cat, index) => {
            const isSelected = selectedCategory === cat.name;
            const palette = PASTEL_COLOR_PALETTES[index % PASTEL_COLOR_PALETTES.length];

            const itemCountDisplay =
              cat.itemCount !== undefined && cat.itemCount !== null && Number(cat.itemCount) > 0
                ? `${cat.itemCount}+ Items`
                : '100+ Items';

            return (
              <div
                key={cat.id || cat.name}
                onClick={() => onSelectCategory?.(cat.name)}
                className={`group relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex items-center justify-between gap-2.5 transition-all duration-300 cursor-pointer overflow-hidden border ${
                  isSelected
                    ? 'ring-2 shadow-md -translate-y-0.5'
                    : 'hover:shadow-md hover:-translate-y-1'
                }`}
                style={{
                  backgroundColor: palette.bg,
                  borderColor: isSelected ? primaryColor || '#E05353' : palette.border,
                  ...(isSelected ? { ringColor: primaryColor || '#E05353' } : {}),
                }}
              >
                {/* Left: Category Image */}
                <div className="w-16 h-20 sm:w-20 sm:h-24 shrink-0 flex items-center justify-center">
                  <img
                    src={
                      cat.imageUrl ||
                      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80'
                    }
                    alt={cat.name}
                    className="w-full h-full object-contain drop-shadow-xs transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1"
                    loading="lazy"
                  />
                </div>

                {/* Right: Category Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-1">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-slate-950">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                      {itemCountDisplay}
                    </p>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="mt-2 sm:mt-3 flex items-center">
                    <span
                      className="inline-flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                      style={{ color: isSelected ? primaryColor || '#E05353' : '#1e293b' }}
                    >
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
