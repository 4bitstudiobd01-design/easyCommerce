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
import { ShopEaseProduct } from '../data/defaultStorefrontData';

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
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  footerDescription?: string;
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
  facebookUrl,
  instagramUrl,
  twitterUrl,
  youtubeUrl,
  footerDescription,
  onSelectProduct,
  onAddToCart,
}: ShopEaseShopViewProps) => {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  // Use only live products from store API
  const masterProducts: ShopEaseProduct[] = useMemo(() => {
    return (products || []) as ShopEaseProduct[];
  }, [products]);

  // Price bounds derived from the real catalog so the slider always fits the
  // store's actual price spread (not a hardcoded 0–5000 window).
  const priceBounds = useMemo<[number, number]>(() => {
    const prices = masterProducts
      .map((p) => Number((p as any).price ?? p.basePrice ?? 0))
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (prices.length === 0) return [0, 5000];
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return max > min ? [min, max] : [0, Math.max(max, 1)];
  }, [masterProducts]);

  // Filter and Sort states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>(priceBounds);
  const [priceTouched, setPriceTouched] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Keep the price range pinned to the live bounds until the shopper drags it.
  useEffect(() => {
    if (!priceTouched) setPriceRange(priceBounds);
  }, [priceBounds, priceTouched]);

  // Two-way sync with the ?category= URL param (also resets to ALL when cleared).
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'ALL');
    setCurrentPage(1);
  }, [searchParams]);

  // Extract real category names
  const categoryNames = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    const fromProducts = Array.from(
      new Set(products.map((p) => p.category?.name).filter(Boolean))
    ) as string[];
    return fromProducts;
  }, [categories, products]);

  // Brand list + per-brand product counts, straight from the live catalog.
  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    masterProducts.forEach((p) => {
      const name =
        typeof p.brand === 'string' ? p.brand : (p.brand as any)?.name || (p as any).brandName;
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [masterProducts]);

  const brandNames = useMemo(() => brandOptions.map((b) => b.name), [brandOptions]);

  // Rating distribution ("N & up") from the backend-supplied avgRating.
  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    masterProducts.forEach((p) => {
      const r = Number((p as any).avgRating ?? p.rating ?? 0);
      for (let stars = 5; stars >= 1; stars -= 1) {
        if (r >= stars) counts[stars] += 1;
      }
    });
    return counts;
  }, [masterProducts]);

  // Handle brand checkbox toggle
  const handleToggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceTouched(true);
    setPriceRange(range);
    setCurrentPage(1);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setPriceTouched(false);
    setPriceRange(priceBounds);
    setSelectedBrands([]);
    setSelectedMinRating(0);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const isPriceFiltered = priceTouched && (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]);

  // Check how many active filters are applied
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'ALL') count += 1;
    if (isPriceFiltered) count += 1;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedMinRating > 0) count += 1;
    return count;
  }, [selectedCategory, isPriceFiltered, selectedBrands, selectedMinRating]);

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

        // Brand Filter — exact match on the product's own brand only.
        const brandName =
          typeof prod.brand === 'string'
            ? prod.brand
            : (prod.brand as any)?.name || (prod as any).brandName;
        const matchesBrand =
          selectedBrands.length === 0 || (brandName && selectedBrands.includes(brandName));

        // Rating Filter
        const prodRating = Number((prod as any).avgRating ?? prod.rating ?? 0);
        const matchesRating = selectedMinRating === 0 || prodRating >= selectedMinRating;

        return matchesCategory && matchesSearch && matchesPrice && matchesBrand && matchesRating;
      })
      .sort((a, b) => {
        const priceA = Number((a as any).price ?? a.basePrice ?? 0);
        const priceB = Number((b as any).price ?? b.basePrice ?? 0);
        const ratingA = Number((a as any).avgRating ?? a.rating ?? 0);
        const ratingB = Number((b as any).avgRating ?? b.rating ?? 0);
        const reviewsA = Number((a as any).reviewCount ?? a.reviewsCount ?? 0);
        const reviewsB = Number((b as any).reviewCount ?? b.reviewsCount ?? 0);

        switch (sortBy) {
          case 'price-asc':
            return priceA - priceB;
          case 'price-desc':
            return priceB - priceA;
          case 'rating':
            return ratingB - ratingA;
          case 'newest':
            return String((b as any).createdAt || b.id || '').localeCompare(
              String((a as any).createdAt || a.id || ''),
            );
          case 'popularity':
          default:
            return reviewsB - reviewsA || ratingB - ratingA;
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
    <div
      className="min-h-screen bg-slate-50/50 font-sans text-slate-900 flex flex-col selection:[background-color:var(--brand-selection)] selection:text-white pb-20 md:pb-0"
      style={{ ['--brand-selection' as any]: primaryColor }}
    >
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
      <ShopPageHeader slug={slug} totalProducts={totalProductsCount} primaryColor={primaryColor} />

      {/* 3. MOBILE QUICK CATEGORY PILLS STRIP (VISIBLE ON MOBILE ONLY) */}
      <div className="lg:hidden bg-white border-b border-slate-200/80 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('ALL');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL' ? 'text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          style={selectedCategory === 'ALL' ? { backgroundColor: primaryColor } : undefined}
        >
          All
        </button>
        {categoryNames.map((catName) => {
          const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
          return (
            <button
              key={catName}
              type="button"
              onClick={() => {
                setSelectedCategory(catName);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected ? 'text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={isSelected ? { backgroundColor: primaryColor } : undefined}
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
          <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: primaryColor }} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span
              className="w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
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
              primaryColor={primaryColor}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              priceRange={priceRange}
              priceBounds={priceBounds}
              onPriceRangeChange={handlePriceRangeChange}
              brands={brandNames}
              brandCounts={Object.fromEntries(brandOptions.map((b) => [b.name, b.count]))}
              selectedBrands={selectedBrands}
              onToggleBrand={handleToggleBrand}
              selectedMinRating={selectedMinRating}
              onSelectMinRating={(rating) => {
                setSelectedMinRating(rating);
                setCurrentPage(1);
              }}
              onResetFilters={handleResetFilters}
              ratingCounts={ratingCounts}
            />
          </div>

          {/* RIGHT PRODUCT GRID (FULL WIDTH ON MOBILE, 9 COLS ON LG) */}
          <div className="lg:col-span-9 min-w-0 space-y-4">
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Filters:
                </span>
                {selectedCategory !== 'ALL' && (
                  <FilterChip
                    label={selectedCategory}
                    primaryColor={primaryColor}
                    onRemove={() => {
                      setSelectedCategory('ALL');
                      setCurrentPage(1);
                    }}
                  />
                )}
                {isPriceFiltered && (
                  <FilterChip
                    label={`৳${priceRange[0].toLocaleString()} – ৳${priceRange[1].toLocaleString()}`}
                    primaryColor={primaryColor}
                    onRemove={() => {
                      setPriceTouched(false);
                      setPriceRange(priceBounds);
                      setCurrentPage(1);
                    }}
                  />
                )}
                {selectedBrands.map((b) => (
                  <FilterChip
                    key={b}
                    label={b}
                    primaryColor={primaryColor}
                    onRemove={() => handleToggleBrand(b)}
                  />
                ))}
                {selectedMinRating > 0 && (
                  <FilterChip
                    label={`${selectedMinRating}★ & up`}
                    primaryColor={primaryColor}
                    onRemove={() => {
                      setSelectedMinRating(0);
                      setCurrentPage(1);
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 ml-auto"
                >
                  Clear all
                </button>
              </div>
            )}
            <ShopProductGrid
              products={pagedProducts}
              storeSlug={slug}
              primaryColor={primaryColor}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalProductsCount={totalProductsCount}
              onOpenDetail={(prod) => onSelectProduct(prod)}
              hasActiveFilters={activeFiltersCount > 0}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>
      </main>

      {/* 6. MOBILE BOTTOM SHEET FILTER DRAWER */}
      <ShopMobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        categories={categoryNames}
        primaryColor={primaryColor}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setCurrentPage(1);
        }}
        priceRange={priceRange}
        priceBounds={priceBounds}
        onPriceRangeChange={handlePriceRangeChange}
        brands={brandNames}
        brandCounts={Object.fromEntries(brandOptions.map((b) => [b.name, b.count]))}
        selectedBrands={selectedBrands}
        onToggleBrand={handleToggleBrand}
        selectedMinRating={selectedMinRating}
        onSelectMinRating={(rating) => {
          setSelectedMinRating(rating);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
        totalProductsCount={totalProductsCount}
        ratingCounts={ratingCounts}
      />

      {/* 7. SHOP TRUST & PROPOSITIONS STRIP */}
      <ShopTrustStrip primaryColor={primaryColor} />

      {/* 8. DARK FOOTER */}
      <ShopEaseFooter
        storeName={storeName}
        slug={slug}
        primaryColor={primaryColor}
        logo={logo}
        facebookUrl={facebookUrl}
        instagramUrl={instagramUrl}
        twitterUrl={twitterUrl}
        youtubeUrl={youtubeUrl}
        footerDescription={footerDescription}
      />

      {/* 9. ULTRA-MODERN NATIVE MOBILE SHOPPING APP DOCK */}
      <StorefrontMobileBottomNav slug={slug} primaryColor={primaryColor} />
    </div>
  );
};

function FilterChip({
  label,
  primaryColor,
  onRemove,
}: {
  label: string;
  primaryColor: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
      style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
    >
      <span>{label}</span>
      <span className="text-current opacity-70">✕</span>
    </button>
  );
}
