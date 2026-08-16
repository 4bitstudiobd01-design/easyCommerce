'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetPublicStoreProductsQuery } from '@/features/storefront/api/storefrontApi';
import { StorefrontNavbar } from '@/features/storefront/components/StorefrontNavbar';
import { ProductCard } from '@/features/storefront/components/ProductCard';
import { ProductDetailModal } from '@/features/storefront/components/ProductDetailModal';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { StorefrontPixelTracker } from '@/features/storefront/components/StorefrontPixelTracker';
import { recordStorefrontVisit } from '@/features/storefront/utils/attribution';
import { NewsletterSignupWidget } from '@/features/email-marketing/components/NewsletterSignupWidget';
import { JsonLdScript } from '@/features/seo/components/JsonLdScript';
import { useGetStoreSeoQuery } from '@/features/seo/api/seoApi';
import { toggleCartDrawer, addToCart } from '@/features/storefront/slices/cartSlice';
import { LuxuryFashionTheme } from '@/features/storefront/themes/LuxuryFashionTheme';
import { TechHubTheme } from '@/features/storefront/themes/TechHubTheme';
import { OrganicGroceryTheme } from '@/features/storefront/themes/OrganicGroceryTheme';
import { MinimalDarkTheme } from '@/features/storefront/themes/MinimalDarkTheme';
import { DefaultStorefrontTheme } from '@/features/storefront/themes/DefaultStorefrontTheme';
import { Product } from '@/features/catalog/api/catalogApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { Store } from 'lucide-react';
import { ProductCardSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function StorefrontPage() {
  const params = useParams();
  const slug = (params.slug as string) || '';
  const dispatch = useDispatch();

  const { data, isLoading, isError } = useGetPublicStoreProductsQuery(slug, {
    skip: !slug,
  });

  const { data: storeSeo } = useGetStoreSeoQuery(slug, {
    skip: !slug,
  });

  const cartItems = useSelector((state: RootState) => state.cart.items);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!slug) return;
    recordStorefrontVisit(slug);
    // Fires once per mount only — not on every internal route change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-96 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (isError || !data?.store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Store Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            The storefront <span className="font-mono text-blue-600 font-bold">"{slug}"</span> does not exist or has been deactivated.
          </p>
        </div>
      </div>
    );
  }

  const { store, products } = data;
  const primaryColor = (store as any).primaryColor || '#2563eb';

  // Extract unique category names
  const categories = Array.from(
    new Set(products.map((p) => p.category?.name).filter(Boolean))
  ) as string[];

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleThemeAddToCart = (product: Product) => {
    dispatch(addToCart({ product, quantity: 1, storeSlug: slug }));
  };

  const activeThemeId = (store as any)?.activeThemeId || 'DEFAULT_MODERN';

  if (activeThemeId === 'LUXURY_FASHION') {
    return (
      <>
        {storeSeo?.jsonLdSchema && <JsonLdScript schema={storeSeo.jsonLdSchema} id="storefront-jsonld" />}
        <StorefrontPixelTracker
          facebookPixelId={(store as any).facebookPixelId}
          tiktokPixelId={(store as any).tiktokPixelId}
          googleTagManagerId={(store as any).googleTagManagerId}
        />
        <CartDrawer />
        <ProductDetailModal product={selectedProduct} storeSlug={slug} onClose={() => setSelectedProduct(null)} />
        <LuxuryFashionTheme
          storeName={store.name}
          slug={store.slug}
          category={store.category}
          products={filteredProducts}
          categories={categories}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onAddToCart={handleThemeAddToCart}
        />
      </>
    );
  }

  if (activeThemeId === 'TECH_HUB') {
    return (
      <>
        {storeSeo?.jsonLdSchema && <JsonLdScript schema={storeSeo.jsonLdSchema} id="storefront-jsonld" />}
        <StorefrontPixelTracker
          facebookPixelId={(store as any).facebookPixelId}
          tiktokPixelId={(store as any).tiktokPixelId}
          googleTagManagerId={(store as any).googleTagManagerId}
        />
        <CartDrawer />
        <ProductDetailModal product={selectedProduct} storeSlug={slug} onClose={() => setSelectedProduct(null)} />
        <TechHubTheme
          storeName={store.name}
          slug={store.slug}
          category={store.category}
          products={filteredProducts}
          categories={categories}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onAddToCart={handleThemeAddToCart}
        />
      </>
    );
  }

  if (activeThemeId === 'ORGANIC_GROCERY') {
    return (
      <>
        {storeSeo?.jsonLdSchema && <JsonLdScript schema={storeSeo.jsonLdSchema} id="storefront-jsonld" />}
        <StorefrontPixelTracker
          facebookPixelId={(store as any).facebookPixelId}
          tiktokPixelId={(store as any).tiktokPixelId}
          googleTagManagerId={(store as any).googleTagManagerId}
        />
        <CartDrawer />
        <ProductDetailModal product={selectedProduct} storeSlug={slug} onClose={() => setSelectedProduct(null)} />
        <OrganicGroceryTheme
          storeName={store.name}
          slug={store.slug}
          category={store.category}
          products={filteredProducts}
          categories={categories}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onAddToCart={handleThemeAddToCart}
        />
      </>
    );
  }

  if (activeThemeId === 'MINIMAL_DARK') {
    return (
      <>
        {storeSeo?.jsonLdSchema && <JsonLdScript schema={storeSeo.jsonLdSchema} id="storefront-jsonld" />}
        <StorefrontPixelTracker
          facebookPixelId={(store as any).facebookPixelId}
          tiktokPixelId={(store as any).tiktokPixelId}
          googleTagManagerId={(store as any).googleTagManagerId}
        />
        <CartDrawer />
        <ProductDetailModal product={selectedProduct} storeSlug={slug} onClose={() => setSelectedProduct(null)} />
        <MinimalDarkTheme
          storeName={store.name}
          slug={store.slug}
          category={store.category}
          products={filteredProducts}
          categories={categories}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onAddToCart={handleThemeAddToCart}
        />
      </>
    );
  }

  // DEFAULT PIXEL-PERFECT SHOPEASE STOREFRONT THEME
  return (
    <>
      {storeSeo?.jsonLdSchema && (
        <JsonLdScript schema={storeSeo.jsonLdSchema} id="storefront-jsonld" />
      )}
      <StorefrontPixelTracker
        facebookPixelId={(store as any).facebookPixelId}
        tiktokPixelId={(store as any).tiktokPixelId}
        googleTagManagerId={(store as any).googleTagManagerId}
      />
      <CartDrawer />
      <ProductDetailModal
        product={selectedProduct}
        storeSlug={slug}
        onClose={() => setSelectedProduct(null)}
      />
      <DefaultStorefrontTheme
        storeName={store.name}
        slug={store.slug}
        category={store.category}
        phone={store.phone}
        address={store.address}
        logo={store.logo}
        primaryColor={primaryColor}
        products={filteredProducts}
        categories={categories}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onAddToCart={handleThemeAddToCart}
      />
    </>
  );
}

