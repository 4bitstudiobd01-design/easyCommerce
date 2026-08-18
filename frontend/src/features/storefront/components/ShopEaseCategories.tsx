'use client';

import React from 'react';
import Link from 'next/link';
import { ShopEaseCategory, SHOPEASE_CATEGORIES } from '../data/defaultStorefrontData';

export interface ShopEaseCategoryItem {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  itemCount?: number;
}

interface ShopEaseCategoriesProps {
  categories?: ShopEaseCategoryItem[];
  selectedCategory?: string;
  storeSlug?: string;
  onSelectCategory?: (category: string) => void;
}

export const ShopEaseCategories = ({
  categories = [],
  selectedCategory = 'ALL',
  storeSlug = 'main',
  onSelectCategory,
}: ShopEaseCategoriesProps) => {
  if (!categories || categories.length === 0) {
    return null;
  }
  return (
    <section id="categories" className="py-14 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION TITLE */}
        <div className="text-center mb-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-black uppercase tracking-wider shadow-2xs">
            <span>✨ Collections</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Browse By Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            Explore curated categories carefully organized for smooth and effortless shopping.
          </p>
        </div>

        {/* CATEGORIES GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <Link
                key={cat.id}
                href={`/store/${storeSlug}/shop?category=${encodeURIComponent(cat.name)}`}
                onClick={() => onSelectCategory?.(cat.name)}
                className={`bg-white rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center text-center border transition-all duration-300 cursor-pointer group active:scale-95 select-none shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${
                  isSelected
                    ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-lg bg-blue-50/30'
                    : 'border-slate-100 hover:border-blue-300/80 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                {/* CATEGORY ICON / IMAGE */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/50 flex items-center justify-center p-2.5 mb-3 group-hover:bg-blue-50/50 transition-colors overflow-hidden border border-slate-100">
                  <img
                    src={cat.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* CATEGORY NAME */}
                <span
                  className={`text-xs font-black transition-colors line-clamp-1 ${
                    isSelected ? 'text-blue-600' : 'text-slate-800 group-hover:text-blue-600'
                  }`}
                >
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
