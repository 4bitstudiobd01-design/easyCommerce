'use client';

import React, { useMemo, useState } from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { useGetPublicStoreCategoriesQuery } from '../api/storefrontApi';
import { ShopEaseNavbar } from '../components/ShopEaseNavbar';
import { ShopEaseHero } from '../components/ShopEaseHero';
import { ShopEaseCategories } from '../components/ShopEaseCategories';
import { ShopEaseFeaturedProducts } from '../components/ShopEaseFeaturedProducts';
import { ShopEasePromoBanner } from '../components/ShopEasePromoBanner';
import { ShopEaseWhyChooseUs } from '../components/ShopEaseWhyChooseUs';
import { ShopEaseFooter } from '../components/ShopEaseFooter';
import { StorefrontMobileBottomNav } from '../components/StorefrontMobileBottomNav';
import {
  SHOPEASE_CATEGORIES,
  SHOPEASE_FEATURED_PRODUCTS,
  ShopEaseProduct,
} from '../data/defaultStorefrontData';

interface HeroBannerSlide {
  id: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
}

interface DefaultStorefrontThemeProps {
  storeName?: string;
  slug?: string;
  category?: string;
  phone?: string;
  address?: string;
  logo?: string;
  primaryColor?: string;
  fontFamily?: string;
  heroBanners?: HeroBannerSlide[];
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
  fontFamily,
  heroBanners = [],
  products = [],
  categories = [],
  onSelectProduct,
  onAddToCart,
}: DefaultStorefrontThemeProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Merchant-ordered categories from the real catalog (sorted by the admin's sortOrder).
  const { data: merchantCategories } = useGetPublicStoreCategoriesQuery(
    { slug },
    { skip: !slug },
  );

  // Category names for navbar and filter — merchant's admin-defined order takes
  // priority; falls back to the explicit `categories` prop, then product-derived names.
  const categoryNames = useMemo(() => {
    if (merchantCategories && merchantCategories.length > 0) {
      return merchantCategories.map((c) => c.name);
    }
    if (categories && categories.length > 0) return categories;
    const fromProducts = Array.from(
      new Set(products.map((p) => p.category?.name).filter(Boolean))
    ) as string[];
    return fromProducts;
  }, [merchantCategories, categories, products]);

  // Fallback: derive categories from loaded products (used only when the merchant
  // category API has nothing yet, e.g. preview mode with no real slug, or a store
  // with zero storefront-visible categories configured).
  const categoriesFromProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; imageUrl: string }>();
    products.forEach((p) => {
      if (p.category?.name && !map.has(p.category.name)) {
        map.set(p.category.name, {
          id: p.category.id || p.category.name,
          name: p.category.name,
          imageUrl:
            typeof p.images?.[0] === 'string'
              ? p.images[0]
              : (p.images?.[0] as any)?.url ||
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
        });
      }
    });
    return Array.from(map.values());
  }, [products]);

  // Structured categories with images for the category slider/grid — merchant's
  // admin-defined order takes priority over the product-derived fallback.
  const structuredCategories = useMemo(() => {
    if (merchantCategories && merchantCategories.length > 0) {
      return merchantCategories.map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
      }));
    }
    return categoriesFromProducts;
  }, [merchantCategories, categoriesFromProducts]);

  // Use only live store products
  const allProducts: ShopEaseProduct[] = useMemo(() => {
    return (products || []) as ShopEaseProduct[];
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
    <div
      className="min-h-screen bg-white font-sans text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white"
      style={fontFamily ? { fontFamily } : undefined}
    >
      {/* 1. NAVBAR */}
      <ShopEaseNavbar
        storeName={storeName}
        slug={slug}
        logo={logo}
        primaryColor={primaryColor}
        category={category}
        categories={categoryNames}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* MAIN BODY SECTIONS */}
      <main className="flex-1">
        {/* 2. HERO BANNER */}
        <ShopEaseHero
          storeName={storeName}
          onShopNowClick={handleShopNow}
          primaryColor={primaryColor}
          banners={heroBanners}
        />

        {/* 3. CATEGORIES (Show only if store has categories) */}
        {structuredCategories.length > 0 && (
          <ShopEaseCategories
            categories={structuredCategories}
            selectedCategory={selectedCategory}
            storeSlug={slug}
            onSelectCategory={handleCategorySelect}
          />
        )}

        {/* 4. FEATURED PRODUCTS */}
        <ShopEaseFeaturedProducts
          products={filteredProducts}
          storeSlug={slug}
          onOpenDetail={(prod) => onSelectProduct(prod as Product)}
        />

        {/* 5. SPECIAL PROMO BANNER */}
        <ShopEasePromoBanner onShopNowClick={handleShopNow} />

        {/* 6. WHY CHOOSE US */}
        <ShopEaseWhyChooseUs storeName={storeName} />
      </main>

      {/* 7. DARK FOOTER */}
      <ShopEaseFooter
        storeName={storeName}
        slug={slug}
        primaryColor={primaryColor}
      />

      {/* 8. ULTRA-MODERN NATIVE MOBILE SHOPPING APP DOCK */}
      <StorefrontMobileBottomNav slug={slug} />
    </div>
  );
};
