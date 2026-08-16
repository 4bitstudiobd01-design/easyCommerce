'use client';

import React from 'react';
import Link from 'next/link';
import { ShopEaseCategory, SHOPEASE_CATEGORIES } from '../data/defaultStorefrontData';

interface ShopEaseCategoriesProps {
  categories?: ShopEaseCategory[];
  selectedCategory?: string;
  storeSlug?: string;
  onSelectCategory?: (category: string) => void;
}

export const ShopEaseCategories = ({
  categories = SHOPEASE_CATEGORIES,
  selectedCategory = 'ALL',
  storeSlug = 'main',
  onSelectCategory,
}: ShopEaseCategoriesProps) => {
  return (
    <section id="categories" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION TITLE */}
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            <span>✨ Explore Collections</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Browse Popular Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            Find everything from high-tech electronics to modern fashion, handpicked for your lifestyle.
          </p>
        </div>

        {/* 8 CATEGORIES GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <Link
                key={cat.id}
                href={`/store/${storeSlug}/shop?category=${encodeURIComponent(cat.name)}`}
                onClick={() => onSelectCategory?.(cat.name)}
                className={`bg-white rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center border transition-all duration-200 cursor-pointer group active:scale-90 select-none ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20'
                    : 'border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* CATEGORY ICON / IMAGE */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-slate-50 flex items-center justify-center p-2 mb-3 group-hover:bg-blue-50/50 transition-colors overflow-hidden">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* CATEGORY NAME */}
                <span
                  className={`text-xs font-bold transition-colors line-clamp-1 ${
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
