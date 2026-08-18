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
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  brands?: string[];
  selectedBrands: string[];
  onToggleBrand: (brandName: string) => void;
  selectedMinRating: number;
  onSelectMinRating: (rating: number) => void;
  onResetFilters: () => void;
  totalProductsCount: number;
}

export function ShopMobileFilterDrawer({
  isOpen,
  onClose,
  categories = [],
  selectedCategory,
  onSelectCategory,
  priceRange,
  onPriceRangeChange,
  brands = [],
  selectedBrands,
  onToggleBrand,
  selectedMinRating,
  onSelectMinRating,
  onResetFilters,
  totalProductsCount,
}: ShopMobileFilterDrawerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'price' | 'brands' | 'rating'>('categories');

  if (!isOpen) return null;

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    priceRange[0] > 0 ||
    priceRange[1] < 5000 ||
    selectedBrands.length > 0 ||
    selectedMinRating > 0;

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
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-black text-slate-900">Filter Products</h2>
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-transform"
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
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
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
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
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
              <span className="text-xs font-bold text-blue-600">
                ৳{priceRange[0]} - ৳{priceRange[1]}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={5000}
              step={100}
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">MIN</span>
                <span className="text-xs font-black text-slate-800">৳{priceRange[0]}</span>
              </div>
              <span className="text-slate-300 font-bold">-</span>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">MAX</span>
                <span className="text-xs font-black text-slate-800">৳{priceRange[1]}</span>
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
                  return (
                    <button
                      key={brandName}
                      type="button"
                      onClick={() => onToggleBrand(brandName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{brandName}</span>
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
              {SHOPEASE_RATINGS.map((rate) => {
                const isSelected = selectedMinRating === rate.stars;
                return (
                  <button
                    key={rate.stars}
                    type="button"
                    onClick={() => onSelectMinRating(isSelected ? 0 : rate.stars)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{rate.stars} & Up</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
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
            className="flex-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 text-center"
          >
            Show {totalProductsCount} Products
          </button>
        </div>

      </div>
    </div>
  );
}
