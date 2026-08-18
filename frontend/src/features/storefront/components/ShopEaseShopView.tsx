'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/features/catalog/api/catalogApi';
import { ShopEaseNavbar } from './ShopEaseNavbar';
import { ShopPageHeader } from './ShopPageHeader';
import { ShopSidebarFilter } from './ShopSidebarFilter';
import { ShopProductGrid } from './ShopProductGrid';
import { ShopTrustStrip } from './ShopTrustStrip';
import { ShopEaseFooter } from './ShopEaseFooter';
import { StorefrontMobileBottomNav } from './StorefrontMobileBottomNav';
import { ShopMobileFilterDrawer } from './ShopMobileFilterDrawer';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import {
  SHOPEASE_CATEGORIES,
  SHOPEASE_FEATURED_PRODUCTS,
  ShopEaseProduct,
} from '../data/defaultStorefrontData';

interface ShopEaseShopViewProps {
  storeName?: string;
  slug?: string;
  category?: string;
  phone?: string;
  address?: string;
  logo?: string;
  primaryColor?: string;
  products?: Product[];
  categories?: string[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ShopEaseShopView = ({
  storeName = 'ShopEase',
  slug = 'main',
  category,
  phone,
  address,
  logo,
  primaryColor = '#2563eb',
  products = [],
  categories = [],
  onSelectProduct,
  onAddToCart,
}: ShopEaseShopViewProps) => {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  // Filter and Sort states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Sync category with URL query param changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Extract real category names
  const categoryNames = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    const fromProducts = Array.from(
      new Set(products.map((p) => p.category?.name).filter(Boolean))
    ) as string[];
    return fromProducts;
  }, [categories, products]);

  // Use only live products from store API
  const masterProducts: ShopEaseProduct[] = useMemo(() => {
    return (products || []) as ShopEaseProduct[];
  }, [products]);

  // Handle brand checkbox toggle
  const handleToggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
    setCurrentPage(1);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setPriceRange([0, 5000]);
    setSelectedBrands([]);
    setSelectedMinRating(0);
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Check how many active filters are applied
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'ALL') count += 1;
    if (priceRange[0] > 0 || priceRange[1] < 5000) count += 1;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedMinRating > 0) count += 1;
    return count;
  }, [selectedCategory, priceRange, selectedBrands, selectedMinRating]);

  // Filter and Sort master product pipeline
  const filteredProducts = useMemo(() => {
    return masterProducts
      .filter((prod) => {
        // Category Filter
        const prodCat = prod.category?.name || '';
        const matchesCategory =
          selectedCategory === 'ALL' ||
          prodCat.toLowerCase() === selectedCategory.toLowerCase();

        // Search Query Filter
        const needle = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          (prod.name || prod.title || '').toLowerCase().includes(needle) ||
          (prod.description || '').toLowerCase().includes(needle);

        // Price Filter
        const price = Number((prod as any).price ?? prod.basePrice ?? 0);
        const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

        // Brand Filter
        const brandName = typeof prod.brand === 'string' ? prod.brand : (prod.brand as any)?.name;
        const matchesBrand =
          selectedBrands.length === 0 ||
          (brandName && selectedBrands.includes(brandName)) ||
          selectedBrands.some((b) =>
            (prod.name || prod.title || '').toLowerCase().includes(b.toLowerCase())
          );

        // Rating Filter
        const prodRating = prod.rating || 4.5;
        const matchesRating = selectedMinRating === 0 || prodRating >= selectedMinRating;

        return matchesCategory && matchesSearch && matchesPrice && matchesBrand && matchesRating;
      })
      .sort((a, b) => {
        const priceA = Number((a as any).price ?? a.basePrice ?? 0);
        const priceB = Number((b as any).price ?? b.basePrice ?? 0);
        const ratingA = a.rating || 4.5;
        const ratingB = b.rating || 4.5;

        switch (sortBy) {
          case 'price-asc':
            return priceA - priceB;
          case 'price-desc':
            return priceB - priceA;
          case 'rating':
            return ratingB - ratingA;
          case 'newest':
            return (b.id || '').localeCompare(a.id || '');
          case 'popularity':
          default:
            return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        }
      });
  }, [
    masterProducts,
    selectedCategory,
    searchQuery,
    priceRange,
    selectedBrands,
    selectedMinRating,
    sortBy,
  ]);

  const totalProductsCount = filteredProducts.length;
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(totalProductsCount / pageSize));
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white pb-20 md:pb-0">
      {/* 1. NAVBAR WITH ACTIVE 'SHOP' TAB */}
      <ShopEaseNavbar
        storeName={storeName}
        slug={slug}
        logo={logo}
        primaryColor={primaryColor}
        category={category}
        categories={categoryNames}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setCurrentPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        activeTab="shop"
      />

      {/* 2. SHOP PAGE HEADER BANNER */}
      <ShopPageHeader slug={slug} totalProducts={totalProductsCount} />

      {/* 3. MOBILE QUICK CATEGORY PILLS STRIP (VISIBLE ON MOBILE ONLY) */}
      <div className="lg:hidden bg-white border-b border-slate-200/80 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('ALL');
            setCurrentPage(1);
          }}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {categoryNames.map((catName) => {
          const isSelected = selectedCategory === catName;
          return (
            <button
              key={catName}
              type="button"
              onClick={() => {
                setSelectedCategory(catName);
                setCurrentPage(1);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {catName}
            </button>
          );
        })}
      </div>

      {/* 4. MOBILE STICKY FILTER & SORT TOOLBAR (VISIBLE ON MOBILE ONLY) */}
      <div className="lg:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-bold transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Quick Sort Select Pill */}
        <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl">
          <ArrowUpDown className="w-3 h-3 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="popularity">Popular</option>
            <option value="price-asc">Price: Low-High</option>
            <option value="price-desc">Price: High-Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {/* Total Count */}
        <span className="text-[11px] font-bold text-slate-500">
          {totalProductsCount} items
        </span>
      </div>

      {/* 5. MAIN 2-COLUMN CATALOG WORKSPACE */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR FILTERS (DESKTOP ONLY - HIDDEN ON MOBILE) */}
          <div className="hidden lg:block lg:col-span-3 min-w-0">
            <ShopSidebarFilter
              categories={categoryNames}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              priceRange={priceRange}
              onPriceRangeChange={(range) => {
                setPriceRange(range);
                setCurrentPage(1);
              }}
              selectedBrands={selectedBrands}
              onToggleBrand={handleToggleBrand}
              selectedMinRating={selectedMinRating}
              onSelectMinRating={(rating) => {
                setSelectedMinRating(rating);
                setCurrentPage(1);
              }}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* RIGHT PRODUCT GRID (FULL WIDTH ON MOBILE, 9 COLS ON LG) */}
          <div className="lg:col-span-9 min-w-0">
            <ShopProductGrid
              products={pagedProducts}
              storeSlug={slug}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalProductsCount={totalProductsCount}
              onOpenDetail={(prod) => onSelectProduct(prod)}
            />
          </div>
        </div>
      </main>

      {/* 6. MOBILE BOTTOM SHEET FILTER DRAWER */}
      <ShopMobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        categories={categoryNames}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setCurrentPage(1);
        }}
        priceRange={priceRange}
        onPriceRangeChange={(range) => {
          setPriceRange(range);
          setCurrentPage(1);
        }}
        selectedBrands={selectedBrands}
        onToggleBrand={handleToggleBrand}
        selectedMinRating={selectedMinRating}
        onSelectMinRating={(rating) => {
          setSelectedMinRating(rating);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
        totalProductsCount={totalProductsCount}
      />

      {/* 7. SHOP TRUST & PROPOSITIONS STRIP */}
      <ShopTrustStrip />

      {/* 8. DARK FOOTER */}
      <ShopEaseFooter
        storeName={storeName}
        slug={slug}
        primaryColor={primaryColor}
      />

      {/* 9. ULTRA-MODERN NATIVE MOBILE SHOPPING APP DOCK */}
      <StorefrontMobileBottomNav slug={slug} />
    </div>
  );
};
