'use client';

import React, { useMemo, useState } from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { ShopEaseNavbar } from '../components/ShopEaseNavbar';
import { ShopEaseHero } from '../components/ShopEaseHero';
import { ShopEaseCategories } from '../components/ShopEaseCategories';
import { ShopEaseFeaturedProducts } from '../components/ShopEaseFeaturedProducts';
import { ShopEasePromoBanner } from '../components/ShopEasePromoBanner';
import { ShopEaseWhyChooseUs } from '../components/ShopEaseWhyChooseUs';
import { ShopEaseFooter } from '../components/ShopEaseFooter';
import {
  SHOPEASE_CATEGORIES,
  SHOPEASE_FEATURED_PRODUCTS,
  ShopEaseProduct,
} from '../data/defaultStorefrontData';

interface DefaultStorefrontThemeProps {
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

export const DefaultStorefrontTheme = ({
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
}: DefaultStorefrontThemeProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract category names (merge API categories and default reference categories)
  const categoryNames = useMemo(() => {
    const defaultNames = SHOPEASE_CATEGORIES.map((c) => c.name);
    const apiNames = categories.length > 0 ? categories : [];
    return Array.from(new Set([...defaultNames, ...apiNames]));
  }, [categories]);

  // Merge live API products or use reference demo products
  const allProducts: ShopEaseProduct[] = useMemo(() => {
    if (products && products.length > 0) {
      return products as ShopEaseProduct[];
    }
    return SHOPEASE_FEATURED_PRODUCTS;
  }, [products]);

  // Filter products by selected category and search input
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const prodCategory = product.category?.name;
      const matchesCategory =
        selectedCategory === 'ALL' ||
        prodCategory?.toLowerCase() === selectedCategory.toLowerCase();

      const needle = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        (product.name || product.title || '').toLowerCase().includes(needle) ||
        (product.description || '').toLowerCase().includes(needle);

      return matchesCategory && matchesSearch;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    const featuredSection = document.getElementById('featured-products');
    if (featuredSection) {
      featuredSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleShopNow = () => {
    const featuredSection = document.getElementById('featured-products');
    if (featuredSection) {
      featuredSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. NAVBAR */}
      <ShopEaseNavbar
        storeName={storeName}
        slug={slug}
        categories={categoryNames}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* MAIN BODY SECTIONS */}
      <main className="flex-1">
        {/* 2. HERO BANNER */}
        <ShopEaseHero storeName={storeName} onShopNowClick={handleShopNow} />

        {/* 3. CATEGORIES */}
        <ShopEaseCategories
          categories={SHOPEASE_CATEGORIES}
          selectedCategory={selectedCategory}
          storeSlug={slug}
          onSelectCategory={handleCategorySelect}
        />

        {/* 4. FEATURED PRODUCTS */}
        <ShopEaseFeaturedProducts
          products={filteredProducts}
          storeSlug={slug}
          onOpenDetail={(prod) => onSelectProduct(prod as Product)}
        />

        {/* 5. SPECIAL PROMO BANNER */}
        <ShopEasePromoBanner onShopNowClick={handleShopNow} />

        {/* 6. WHY CHOOSE US */}
        <ShopEaseWhyChooseUs />
      </main>

      {/* 7. DARK FOOTER */}
      <ShopEaseFooter storeName={storeName} slug={slug} />
    </div>
  );
};
