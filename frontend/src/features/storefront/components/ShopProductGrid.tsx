'use client';

import React from 'react';
import { LayoutGrid, List, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { ShopEaseProductCard } from './ShopEaseProductCard';
import { ShopEaseProduct } from '../data/defaultStorefrontData';
import { Product } from '@/features/catalog/api/catalogApi';

interface ShopProductGridProps {
  products: ShopEaseProduct[];
  storeSlug?: string;
  primaryColor?: string;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalProductsCount: number;
  onOpenDetail?: (product: Product) => void;
}

export const ShopProductGrid = ({
  products,
  storeSlug = 'main',
  primaryColor = '#2563eb',
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  currentPage,
  totalPages,
  onPageChange,
  totalProductsCount,
  onOpenDetail,
}: ShopProductGridProps) => {
  const startItem = totalProductsCount === 0 ? 0 : (currentPage - 1) * 8 + 1;
  const endItem = Math.min(currentPage * 8, totalProductsCount);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. TOP CONTROLS BAR (DESKTOP ONLY) */}
      <div className="hidden lg:flex bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:px-5 flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        {/* Count Label */}
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800 font-bold">{startItem}-{endItem}</strong> of{' '}
          <strong className="text-slate-800 font-bold">{totalProductsCount}</strong> products
        </span>

        {/* Sort & View Mode Controls */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort-by" className="text-xs font-semibold text-slate-600 shrink-0">
              Sort by:
            </label>
            <select
              id="shop-sort-by"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E')] bg-[length:14px] bg-[right_0.6rem_center] bg-no-repeat cursor-pointer focus:[border-color:var(--focus-accent)] focus:[box-shadow:0_0_0_2px_var(--focus-ring)]"
              style={{ ['--focus-accent' as any]: primaryColor, ['--focus-ring' as any]: `${primaryColor}33` }}
            >
              <option value="popularity">Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Grid / List View Switcher */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">View:</span>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid View"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={
                viewMode === 'grid'
                  ? { backgroundColor: primaryColor, color: '#fff' }
                  : { backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#94a3b8' }
              }
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List View"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={
                viewMode === 'list'
                  ? { backgroundColor: primaryColor, color: '#fff' }
                  : { backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#94a3b8' }
              }
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRODUCT CARDS GRID (2 COLUMNS ON MOBILE, 3-4 ON DESKTOP) */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 space-y-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: `${primaryColor}14`, color: primaryColor, border: `1px solid ${primaryColor}22` }}
          >
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">No Matching Products</h3>
          <p className="text-xs text-slate-500">
            Try loosening your filters, changing price range, or searching for another keyword.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {products.map((product) => (
            <ShopEaseProductCard
              key={product.id}
              product={product}
              storeSlug={storeSlug}
              primaryColor={primaryColor}
              onOpenDetail={(prod) => onOpenDetail?.(prod as Product)}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => onOpenDetail?.(product as Product)}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-4 cursor-pointer group"
            >
              <div className="w-24 h-24 rounded-xl bg-slate-50 flex items-center justify-center p-2 shrink-0">
                <img
                  src={product.images?.[0]?.url || product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                  alt={product.name || product.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  {product.category?.name || 'General'}
                </span>
                <h3
                  className="text-sm font-bold text-slate-900 transition-colors group-hover:[color:var(--title-hover)]"
                  style={{ ['--title-hover' as any]: primaryColor }}
                >
                  {product.name || product.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-base font-black text-slate-900">
                  ৳{Number(product.price ?? (product as any).basePrice ?? 0).toLocaleString('en-US')}
                </span>
                <button
                  type="button"
                  className="px-4 py-2 hover:brightness-110 text-white rounded-xl text-xs font-bold transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <nav aria-label="Catalog pagination" className="flex items-center justify-center gap-1.5 pt-4">
          {/* Previous Arrow */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            aria-current={currentPage === 1 ? 'page' : undefined}
            className="w-8 h-8 rounded-lg text-xs font-bold transition-colors"
            style={
              currentPage === 1
                ? { backgroundColor: primaryColor, color: '#fff' }
                : { border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569' }
            }
          >
            1
          </button>

          <button
            type="button"
            onClick={() => onPageChange(2)}
            aria-current={currentPage === 2 ? 'page' : undefined}
            className="w-8 h-8 rounded-lg text-xs font-bold transition-colors"
            style={
              currentPage === 2
                ? { backgroundColor: primaryColor, color: '#fff' }
                : { border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569' }
            }
          >
            2
          </button>

          <button
            type="button"
            onClick={() => onPageChange(3)}
            aria-current={currentPage === 3 ? 'page' : undefined}
            className="w-8 h-8 rounded-lg text-xs font-bold transition-colors"
            style={
              currentPage === 3
                ? { backgroundColor: primaryColor, color: '#fff' }
                : { border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569' }
            }
          >
            3
          </button>

          <span className="px-1 text-xs font-bold text-slate-400">...</span>

          <button
            type="button"
            onClick={() => onPageChange(11)}
            aria-current={currentPage === 11 ? 'page' : undefined}
            className="w-8 h-8 rounded-lg text-xs font-bold transition-colors"
            style={
              currentPage === 11
                ? { backgroundColor: primaryColor, color: '#fff' }
                : { border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569' }
            }
          >
            11
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
