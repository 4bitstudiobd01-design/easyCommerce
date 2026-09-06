'use client';

import React, { useMemo, useState } from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { useGetPublicStoreCategoriesQuery, useGetPublicStoreProductsQuery } from '../api/storefrontApi';
import { ShopEaseNavbar } from '../components/ShopEaseNavbar';
import { ShopEaseHero } from '../components/ShopEaseHero';
import { ShopEaseFeaturesBar } from '../components/ShopEaseFeaturesBar';
import { ShopEaseCategories } from '../components/ShopEaseCategories';
import { ShopEaseFeaturedProducts } from '../components/ShopEaseFeaturedProducts';
import { ShopEaseProductSection } from '../components/ShopEaseProductSection';
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
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  footerDescription?: string;
  products?: Product[];
  categories?: string[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  showHeroSection?: boolean;
  showCategoriesSection?: boolean;
  showFeaturedProducts?: boolean;
  showNewArrivals?: boolean;
  showBestSellers?: boolean;
  showFullCatalog?: boolean;
  showPromoBanner?: boolean;
  showWhyChooseUs?: boolean;
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
  facebookUrl,
  instagramUrl,
  twitterUrl,
  youtubeUrl,
  footerDescription,
  products = [],
  categories = [],
  onSelectProduct,
  onAddToCart,
  showHeroSection = true,
  showCategoriesSection = true,
  showFeaturedProducts = true,
  showNewArrivals = true,
  showBestSellers = true,
  showFullCatalog = true,
  showPromoBanner = true,
  showWhyChooseUs = true,
}: DefaultStorefrontThemeProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Merchant-ordered categories from the real catalog (sorted by the admin's sortOrder, limit to 10 for homepage).
  const { data: merchantCategories } = useGetPublicStoreCategoriesQuery(
    { slug, limit: 10 },
    { skip: !slug },
  );

  // Curated homepage rows — each pulls only the products the merchant placed in
  // that section, already ordered by the sortOrder set in the reorder modal.
  const { data: heroSectionData } = useGetPublicStoreProductsQuery(
    { slug, section: 'HERO' },
    { skip: !slug },
  );
  const { data: featuredData } = useGetPublicStoreProductsQuery(
    { slug, section: 'FEATURED' },
    { skip: !slug },
  );
  const { data: newArrivalsData } = useGetPublicStoreProductsQuery(
    { slug, section: 'NEW_ARRIVALS' },
    { skip: !slug },
  );
  const { data: bestSellersData } = useGetPublicStoreProductsQuery(
    { slug, section: 'BEST_SELLERS' },
    { skip: !slug },
  );
  const heroProducts = (heroSectionData?.products || []) as Product[];
  const featured = (featuredData?.products || []) as ShopEaseProduct[];
  const newArrivals = (newArrivalsData?.products || []) as ShopEaseProduct[];
  const bestSellers = (bestSellersData?.products || []) as ShopEaseProduct[];

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
    // Count products per category
    const countMap = new Map<string, number>();
    products.forEach((p) => {
      const catName = p.category?.name;
      if (catName) {
        countMap.set(catName, (countMap.get(catName) || 0) + 1);
      }
    });

    let list: Array<{ id: string; name: string; imageUrl: string; itemCount: number }> = [];

    if (merchantCategories && merchantCategories.length > 0) {
      list = merchantCategories.map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.image || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300',
        itemCount: countMap.get(c.name) || (c as any).productCount || (c as any).productsCount || 0,
      }));
    } else if (categoriesFromProducts.length > 0) {
      list = categoriesFromProducts.map((c) => ({
        ...c,
        itemCount: countMap.get(c.name) || 0,
      }));
    } else {
      list = SHOPEASE_CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
        itemCount: c.itemCount,
      }));
    }

    // Homepage limit: Show at most 10 categories (rest viewable on View All Categories page)
    return list.slice(0, 10);
  }, [merchantCategories, categoriesFromProducts, products]);

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
      className="min-h-screen bg-white font-sans text-slate-900 flex flex-col selection:[background-color:var(--brand-selection)] selection:text-white"
      style={{ ...(fontFamily ? { fontFamily } : {}), ['--brand-selection' as any]: primaryColor }}
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
        {/* 2. HERO BANNER — merchant banner images take priority; when none are set,
            the products tagged "Hero" fill the carousel instead. */}
        {showHeroSection && (
          <ShopEaseHero
            storeName={storeName}
            onShopNowClick={handleShopNow}
            primaryColor={primaryColor}
            banners={heroBanners}
            heroProducts={heroProducts}
            storeSlug={slug}
          />
        )}

        {/* 3. TRUST & PERKS FLOATING BAR (Exactly 50% on hero banner, 50% below) */}
        <div className={showHeroSection ? 'relative z-30 -translate-y-1/2 -mb-8 sm:-mb-10 lg:-mb-12' : 'my-6'}>
          <ShopEaseFeaturesBar primaryColor={primaryColor} />
        </div>

        {/* 4. CATEGORIES (Matching Image 1) */}
        {showCategoriesSection && structuredCategories.length > 0 && (
          <ShopEaseCategories
            categories={structuredCategories}
            selectedCategory={selectedCategory}
            storeSlug={slug}
            primaryColor={primaryColor}
            onSelectCategory={handleCategorySelect}
          />
        )}

        {/* 4. CURATED HOMEPAGE ROWS — each hidden if the merchant placed nothing in it.
            Not affected by the category filter: these are hand-picked, ordered sets. */}
        {showFeaturedProducts && (
          <ShopEaseProductSection
            id="featured"
            badge="✨ Featured Collection"
            title="Featured Products"
            subtitle="Hand-picked highlights from across the store."
            products={featured}
            storeSlug={slug}
            primaryColor={primaryColor}
            tone="muted"
            hideWhenEmpty
            onOpenDetail={(prod) => onSelectProduct(prod as Product)}
          />
        )}

        {showNewArrivals && (
          <ShopEaseProductSection
            id="new-arrivals"
            badge="🆕 Just In"
            title="New Arrivals"
            subtitle="The latest additions to the catalog."
            products={newArrivals}
            storeSlug={slug}
            primaryColor={primaryColor}
            tone="white"
            hideWhenEmpty
            onOpenDetail={(prod) => onSelectProduct(prod as Product)}
          />
        )}

        {showBestSellers && (
          <ShopEaseProductSection
            id="best-sellers"
            badge="🔥 Most Popular"
            title="Best Sellers"
            subtitle="Customer favourites, ready to ship."
            products={bestSellers}
            storeSlug={slug}
            primaryColor={primaryColor}
            tone="muted"
            hideWhenEmpty
            onOpenDetail={(prod) => onSelectProduct(prod as Product)}
          />
        )}

        {/* 5. FULL CATALOG — every published product, honours the category/search filter */}
        {showFullCatalog && (
          <ShopEaseFeaturedProducts
            products={filteredProducts}
            storeSlug={slug}
            primaryColor={primaryColor}
            onOpenDetail={(prod) => onSelectProduct(prod as Product)}
          />
        )}

        {/* 6. SPECIAL PROMO BANNER */}
        {showPromoBanner && <ShopEasePromoBanner onShopNowClick={handleShopNow} primaryColor={primaryColor} />}

        {/* 6. WHY CHOOSE US */}
        {showWhyChooseUs && <ShopEaseWhyChooseUs storeName={storeName} primaryColor={primaryColor} />}
      </main>

      {/* 7. DARK FOOTER */}
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

      {/* 8. ULTRA-MODERN NATIVE MOBILE SHOPPING APP DOCK */}
      <StorefrontMobileBottomNav slug={slug} primaryColor={primaryColor} />
    </div>
  );
};
