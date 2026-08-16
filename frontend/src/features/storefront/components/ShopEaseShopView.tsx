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
  const initialCategory = searchParams?.get('category') || 'ALL';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync category state when URL search params change
  useEffect(() => {
    const cat = searchParams?.get('category');
    if (cat) {
      setSelectedCategory(cat);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Extract category names (merge API categories and default reference categories)
  const categoryNames = useMemo(() => {
    const defaultNames = SHOPEASE_CATEGORIES.map((c) => c.name);
    const apiNames = categories.length > 0 ? categories : [];
    return Array.from(new Set([...defaultNames, ...apiNames]));
  }, [categories]);

  // Master product list (API products or reference demo products)
  const masterProducts: ShopEaseProduct[] = useMemo(() => {
    if (products && products.length > 0) {
      return products as ShopEaseProduct[];
    }
    return SHOPEASE_FEATURED_PRODUCTS;
  }, [products]);

  const handleToggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSearchQuery('');
    setPriceRange([0, 5000]);
    setSelectedBrands([]);
    setSelectedMinRating(0);
    setCurrentPage(1);
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let list = masterProducts.filter((product) => {
      // 1. Category Filter
      if (selectedCategory && selectedCategory !== 'ALL') {
        const sel = selectedCategory.trim().toLowerCase();
        const prodCatName = typeof product.category === 'string'
          ? product.category
          : product.category?.name || (product as any).categoryName || '';
        const prodCatSlug = typeof product.category === 'object'
          ? product.category?.slug || ''
          : '';
        const prodCatId = typeof product.category === 'object'
          ? product.category?.id || ''
          : (product as any).categoryId || '';

        const normalizedSel = sel.replace(/[^a-z0-9]/g, '');
        const normalizedProdName = prodCatName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedProdSlug = prodCatSlug.toLowerCase().replace(/[^a-z0-9]/g, '');

        const matches =
          prodCatName.toLowerCase() === sel ||
          prodCatSlug.toLowerCase() === sel ||
          prodCatId.toLowerCase() === sel ||
          (normalizedSel.length > 0 && normalizedProdName === normalizedSel) ||
          (normalizedSel.length > 0 && normalizedProdSlug === normalizedSel) ||
          (normalizedProdName.length > 0 && normalizedProdName.includes(normalizedSel));

        if (!matches) return false;
      }

      // 2. Search Query Filter
      if (searchQuery) {
        const needle = searchQuery.trim().toLowerCase();
        const haystack = [product.name, product.title, product.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      // 3. Price Range Filter
      const price = Number((product as any).price ?? product.basePrice ?? 0);
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }

      // 4. Brand Filter
      if (selectedBrands.length > 0) {
        const prodBrand = product.brandName || (product.brand as any)?.name || '';
        if (!selectedBrands.includes(prodBrand)) {
          return false;
        }
      }

      // 5. Rating Filter
      if (selectedMinRating > 0) {
        const rating = product.rating || 4.5;
        if (rating < selectedMinRating) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      const priceA = Number((a as any).price ?? a.basePrice ?? 0);
      const priceB = Number((b as any).price ?? b.basePrice ?? 0);
      const ratingA = a.rating || 4.5;
      const ratingB = b.rating || 4.5;

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return ratingB - ratingA;
      if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
      // Popularity default
      return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    });

    return list;
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
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. NAVBAR WITH ACTIVE 'SHOP' TAB */}
      <ShopEaseNavbar
        storeName={storeName}
        slug={slug}
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

      {/* 3. MAIN 2-COLUMN CATALOG WORKSPACE */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR FILTERS (3 COLS ON LG) */}
          <div className="lg:col-span-3 min-w-0">
            <ShopSidebarFilter
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

          {/* RIGHT PRODUCT GRID (9 COLS ON LG) */}
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

      {/* 4. SHOP TRUST & PROPOSITIONS STRIP */}
      <ShopTrustStrip />

      {/* 5. DARK FOOTER */}
      <ShopEaseFooter storeName={storeName} slug={slug} />
    </div>
  );
};
