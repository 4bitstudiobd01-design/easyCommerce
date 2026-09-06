'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useGetPublicStoreCategoriesQuery,
  useGetPublicStoreProductsQuery,
} from '@/features/storefront/api/storefrontApi';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { ShopEaseFooter } from '@/features/storefront/components/ShopEaseFooter';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { StorefrontMobileBottomNav } from '@/features/storefront/components/StorefrontMobileBottomNav';
import { StorefrontPixelTracker } from '@/features/storefront/components/StorefrontPixelTracker';
import { SHOPEASE_CATEGORIES } from '@/features/storefront/data/defaultStorefrontData';
import { ArrowLeft, ArrowRight, Sparkles, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

const PASTEL_COLOR_PALETTES = [
  { bg: '#FAF3EA', border: '#F2E7DC' },
  { bg: '#FFF3E8', border: '#FBE7D4' },
  { bg: '#EBF5F1', border: '#DCEFE8' },
  { bg: '#FCEEF1', border: '#F8DEE4' },
  { bg: '#F7EEED', border: '#EFE0DF' },
  { bg: '#EEF4FB', border: '#DCE7F5' },
  { bg: '#FEF9EC', border: '#FBEECB' },
  { bg: '#F3EEFA', border: '#E6DCF5' },
];

export default function AllCategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || '';

  const [searchQuery, setSearchQuery] = useState('');

  const { data: storeData, isLoading: isStoreLoading } = useGetPublicStoreProductsQuery(
    { slug },
    { skip: !slug }
  );

  // Fetch all categories without limit
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useGetPublicStoreCategoriesQuery({ slug }, { skip: !slug });

  const store = storeData?.store;
  const products = storeData?.products || [];
  const primaryColor = (store as any)?.primaryColor || '#E05353';

  // Map product counts
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const catName = p.category?.name;
      if (catName) {
        map.set(catName, (map.get(catName) || 0) + 1);
      }
    });
    return map;
  }, [products]);

  // Structured categories
  const allCategories = useMemo(() => {
    if (categoriesData && categoriesData.length > 0) {
      return categoriesData.map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.image || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
        itemCount: categoryCounts.get(c.name) || (c as any).productCount || 0,
      }));
    }
    // Derive from products
    if (products.length > 0) {
      const map = new Map<string, { id: string; name: string; imageUrl: string; itemCount: number }>();
      products.forEach((p) => {
        if (p.category?.name && !map.has(p.category.name)) {
          map.set(p.category.name, {
            id: p.category.id || p.category.name,
            name: p.category.name,
            imageUrl:
              typeof p.images?.[0] === 'string'
                ? p.images[0]
                : (p.images?.[0] as any)?.url ||
                  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
            itemCount: categoryCounts.get(p.category.name) || 0,
          });
        }
      });
      if (map.size > 0) return Array.from(map.values());
    }
    // Fallback demo categories
    return SHOPEASE_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl,
      itemCount: c.itemCount,
    }));
  }, [categoriesData, products, categoryCounts]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;
    const q = searchQuery.toLowerCase();
    return allCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [allCategories, searchQuery]);

  if (isStoreLoading || isCategoriesLoading) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </header>
        <main className="max-w-7xl mx-auto px-4 py-12 w-full space-y-6">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Store Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <StorefrontPixelTracker
        facebookPixelId={(store as any).facebookPixelId}
        tiktokPixelId={(store as any).tiktokPixelId}
        googleTagManagerId={(store as any).googleTagManagerId}
      />
      <CartDrawer primaryColor={primaryColor} />

      {/* NAVBAR */}
      <ShopEaseNavbar
        storeName={store.name}
        slug={slug}
        logo={store.logo}
        primaryColor={primaryColor}
        category={store.category}
        categories={allCategories.map((c) => c.name)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* BREADCRUMB & BACK */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
            <Link
              href={`/store/${slug}`}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">All Categories</span>
          </div>

          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 mb-8 border-b border-slate-100">
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ backgroundColor: `${primaryColor}14`, color: primaryColor }}
              >
                <Sparkles className="w-3 h-3" />
                <span>All Collections</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Browse All Categories
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Explore our full range of curated categories and shop your favorite styles.
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500 self-start sm:self-end">
              {filteredCategories.length} Categories available
            </span>
          </div>

          {/* CATEGORIES GRID */}
          {filteredCategories.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <p className="text-sm font-semibold">No categories found matching &quot;{searchQuery}&quot;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
              {filteredCategories.map((cat, index) => {
                const palette = PASTEL_COLOR_PALETTES[index % PASTEL_COLOR_PALETTES.length];
                const itemCountDisplay =
                  cat.itemCount !== undefined && cat.itemCount !== null && Number(cat.itemCount) > 0
                    ? `${cat.itemCount}+ Items`
                    : '100+ Items';

                return (
                  <div
                    key={cat.id || cat.name}
                    onClick={() =>
                      router.push(
                        `/store/${slug}/shop?category=${encodeURIComponent(cat.name)}`
                      )
                    }
                    className="group relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex items-center justify-between gap-2.5 transition-all duration-300 cursor-pointer overflow-hidden border hover:shadow-md hover:-translate-y-1"
                    style={{
                      backgroundColor: palette.bg,
                      borderColor: palette.border,
                    }}
                  >
                    {/* Left: Category Image */}
                    <div className="w-16 h-20 sm:w-20 sm:h-24 shrink-0 flex items-center justify-center">
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-contain drop-shadow-xs transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1"
                        loading="lazy"
                      />
                    </div>

                    {/* Right: Category Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-1">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-slate-950">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                          {itemCountDisplay}
                        </p>
                      </div>

                      {/* Arrow Indicator */}
                      <div className="mt-2 sm:mt-3 flex items-center">
                        <span className="inline-flex items-center justify-center text-slate-800 transition-all duration-300 group-hover:translate-x-1">
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <ShopEaseFooter
        storeName={store.name}
        slug={slug}
        primaryColor={primaryColor}
        logo={store.logo}
        facebookUrl={store.facebookUrl}
        instagramUrl={store.instagramUrl}
        twitterUrl={store.twitterUrl}
        youtubeUrl={store.youtubeUrl}
        footerDescription={store.footerDescription}
      />

      <StorefrontMobileBottomNav slug={slug} primaryColor={primaryColor} />
    </div>
  );
}
