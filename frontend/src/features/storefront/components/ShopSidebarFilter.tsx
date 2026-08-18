'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Star, RotateCcw } from 'lucide-react';
import {
  SHOPEASE_CATEGORIES,
  SHOPEASE_BRANDS,
  SHOPEASE_RATINGS,
  ShopEaseCategory,
} from '../data/defaultStorefrontData';

interface ShopSidebarFilterProps {
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
}

export const ShopSidebarFilter = ({
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
}: ShopSidebarFilterProps) => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isBrandsOpen, setIsBrandsOpen] = useState(true);
  const [isRatingsOpen, setIsRatingsOpen] = useState(true);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const availableBrands = brands.length > 0 ? brands : [];
  const displayBrands = showAllBrands ? availableBrands : availableBrands.slice(0, 5);

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    priceRange[0] > 0 ||
    priceRange[1] < 5000 ||
    selectedBrands.length > 0 ||
    selectedMinRating > 0;

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-6">
      {/* 1. SIDEBAR HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Filter By</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 2. CATEGORIES FILTER */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 focus:outline-none"
        >
          <span>Categories</span>
          {isCategoriesOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isCategoriesOpen && (
          categories.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-medium py-1 px-1">No categories yet</p>
          ) : (
            <ul className="space-y-1.5 pt-1 text-xs">
              {categories.map((catName) => {
                const isSelected =
                  selectedCategory.toLowerCase() === catName.toLowerCase();
                return (
                  <li key={catName}>
                    <button
                      type="button"
                      onClick={() => onSelectCategory(isSelected ? 'ALL' : catName)}
                      className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'text-blue-600 font-extrabold bg-blue-50/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span>{catName}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        )}
      </div>

      {/* 3. PRICE RANGE FILTER */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 focus:outline-none"
        >
          <span>Price Range</span>
          {isPriceOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isPriceOpen && (
          <div className="space-y-3 pt-1">
            {/* Range Slider */}
            <div className="px-1">
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Inputs: ৳ 0 - ৳ 5,000 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium">
                <span className="text-slate-400 mr-1">৳</span>
                <input
                  type="number"
                  min="0"
                  max={priceRange[1]}
                  value={priceRange[0]}
                  onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                  className="w-full bg-transparent focus:outline-none text-slate-800 text-xs font-bold"
                />
              </div>
              <span className="text-slate-400 text-xs font-bold">-</span>
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium">
                <span className="text-slate-400 mr-1">৳</span>
                <input
                  type="number"
                  min={priceRange[0]}
                  max="5000"
                  value={priceRange[1]}
                  onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                  className="w-full bg-transparent focus:outline-none text-slate-800 text-xs font-bold"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. BRAND FILTER */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsBrandsOpen(!isBrandsOpen)}
          className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 focus:outline-none"
        >
          <span>Brand</span>
          {isBrandsOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isBrandsOpen && (
          availableBrands.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-medium py-1 px-1">No brands yet</p>
          ) : (
            <div className="space-y-2 pt-1">
              <ul className="space-y-2 text-xs">
                {displayBrands.map((brandName) => {
                  const isChecked = selectedBrands.includes(brandName);
                  return (
                    <li key={brandName} className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleBrand(brandName)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 rounded-md cursor-pointer"
                        />
                        <span className={`text-xs font-medium ${isChecked ? 'font-bold text-blue-600' : ''}`}>
                          {brandName}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {availableBrands.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllBrands(!showAllBrands)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 pt-1 flex items-center gap-1"
                >
                  <span>{showAllBrands ? 'Show Less' : `+${availableBrands.length - 5} More`}</span>
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* 5. RATING FILTER */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsRatingsOpen(!isRatingsOpen)}
          className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 focus:outline-none"
        >
          <span>Rating</span>
          {isRatingsOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isRatingsOpen && (
          <ul className="space-y-2 pt-1 text-xs">
            {SHOPEASE_RATINGS.map((ratingOption) => {
              const isChecked = selectedMinRating === ratingOption.stars;
              return (
                <li key={ratingOption.stars} className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onSelectMinRating(isChecked ? 0 : ratingOption.stars)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < ratingOption.stars
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 ml-1">
                      & up
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-semibold">({ratingOption.count})</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};
