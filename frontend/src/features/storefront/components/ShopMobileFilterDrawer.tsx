'use client';

import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Star,
  Check,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import {
  SHOPEASE_CATEGORIES,
  SHOPEASE_BRANDS,
  SHOPEASE_RATINGS,
  ShopEaseCategory,
} from '../data/defaultStorefrontData';

interface ShopMobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: string[];
  primaryColor?: string;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  priceRange: [number, number];
  priceBounds?: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  brands?: string[];
  brandCounts?: Record<string, number>;
  selectedBrands: string[];
  onToggleBrand: (brandName: string) => void;
  selectedMinRating: number;
  onSelectMinRating: (rating: number) => void;
  onResetFilters: () => void;
  totalProductsCount: number;
  ratingCounts?: Record<number, number>;
}

export function ShopMobileFilterDrawer({
  isOpen,
  onClose,
  categories = [],
  primaryColor = '#2563eb',
  selectedCategory,
  onSelectCategory,
  priceRange,
  priceBounds = [0, 5000],
  onPriceRangeChange,
  brands = [],
  brandCounts = {},
  selectedBrands,
  onToggleBrand,
  selectedMinRating,
  onSelectMinRating,
  onResetFilters,
  totalProductsCount,
  ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
}: ShopMobileFilterDrawerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'price' | 'brands' | 'rating'>('categories');

  if (!isOpen) return null;

  const [minBound, maxBound] = priceBounds;
  const priceStep = Math.max(1, Math.round((maxBound - minBound) / 100) || 1);

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    priceRange[0] > minBound ||
    priceRange[1] < maxBound ||
    selectedBrands.length > 0 ||
    selectedMinRating > 0;

  const RATING_LEVELS = [5, 4, 3, 2, 1];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sliding Mobile Bottom Sheet */}
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom-8 duration-300">
        
        {/* 1. Header with Drag Handle & Close */}
        <div className="pt-3 pb-3 px-5 border-b border-slate-100 flex flex-col items-center">
          <div className="w-10 h-1 bg-slate-300 rounded-full mb-3" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" style={{ color: primaryColor }} />
              <h2 className="text-base font-black text-slate-900">Filter Products</h2>
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-xs font-bold hover:brightness-110 flex items-center gap-1 active:scale-95 transition-transform"
                  style={{ color: primaryColor }}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Scrollable Body with Native Touch Tabs */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          
          {/* Section: Categories */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelectCategory('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  selectedCategory === 'ALL' ? 'text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={selectedCategory === 'ALL' ? { backgroundColor: primaryColor, boxShadow: `0 4px 12px -2px ${primaryColor}33` } : undefined}
              >
                All Categories
              </button>
              {categories.map((catName) => {
                const isSelected = selectedCategory === catName;
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => onSelectCategory(catName)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                      isSelected ? 'text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    style={isSelected ? { backgroundColor: primaryColor, boxShadow: `0 4px 12px -2px ${primaryColor}33` } : undefined}
                  >
                    <span>{catName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Price Range */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Price Range
              </h3>
              <span className="text-xs font-bold" style={{ color: primaryColor }}>
                ৳{priceRange[0].toLocaleString()} - ৳{priceRange[1].toLocaleString()}
              </span>
            </div>

            <input
              type="range"
              min={minBound}
              max={maxBound}
              step={priceStep}
              value={priceRange[1]}
              onChange={(e) =>
                onPriceRangeChange([priceRange[0], Math.max(priceRange[0], Number(e.target.value))])
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: primaryColor }}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">MIN</span>
                <span className="text-xs font-black text-slate-800">
                  ৳{priceRange[0].toLocaleString()}
                </span>
              </div>
              <span className="text-slate-300 font-bold">-</span>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">MAX</span>
                <span className="text-xs font-black text-slate-800">
                  ৳{priceRange[1].toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Popular Brands */}
          {brands.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Brands
              </h3>
              <div className="flex flex-wrap gap-2">
                {brands.map((brandName) => {
                  const isSelected = selectedBrands.includes(brandName);
                  const count = brandCounts[brandName];
                  return (
                    <button
                      key={brandName}
                      type="button"
                      onClick={() => onToggleBrand(brandName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                        isSelected ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      style={isSelected ? { backgroundColor: primaryColor } : undefined}
                    >
                      <span>{brandName}</span>
                      {count != null && (
                        <span className={isSelected ? 'opacity-80' : 'text-slate-400'}>
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Minimum Rating */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Customer Rating
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {RATING_LEVELS.map((stars) => {
                const isSelected = selectedMinRating === stars;
                const count = ratingCounts[stars] ?? 0;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => onSelectMinRating(isSelected ? 0 : stars)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                      isSelected ? '' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                    style={
                      isSelected
                        ? { borderColor: primaryColor, backgroundColor: `${primaryColor}0d`, color: primaryColor }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{stars} & Up</span>
                      <span className="text-[10px] text-slate-400 font-semibold">({count})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5" style={{ color: primaryColor }} />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* 3. Sticky Bottom Action Bar */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors active:scale-95 text-center"
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-2 py-3 hover:brightness-110 text-white font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-95 text-center"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -6px ${primaryColor}66` }}
          >
            Show {totalProductsCount} Products
          </button>
        </div>

      </div>
    </div>
  );
}
