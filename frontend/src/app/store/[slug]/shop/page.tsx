'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetPublicStoreProductsQuery } from '@/features/storefront/api/storefrontApi';
import { ProductDetailModal } from '@/features/storefront/components/ProductDetailModal';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { StorefrontPixelTracker } from '@/features/storefront/components/StorefrontPixelTracker';
import { JsonLdScript } from '@/features/seo/components/JsonLdScript';
import { useGetStoreSeoQuery } from '@/features/seo/api/seoApi';
import { addToCart } from '@/features/storefront/slices/cartSlice';
import { ShopEaseShopView } from '@/features/storefront/components/ShopEaseShopView';
import { Product } from '@/features/catalog/api/catalogApi';
import { useDispatch } from 'react-redux';
import { Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { recordStorefrontVisit } from '@/features/storefront/utils/attribution';

export default function ShopPage() {
  const params = useParams();
  const slug = (params.slug as string) || '';
  const dispatch = useDispatch();

  const { data, isLoading, isError } = useGetPublicStoreProductsQuery({ slug }, {
    skip: !slug,
  });

  const { data: storeSeo } = useGetStoreSeoQuery(slug, {
    skip: !slug,
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!slug) return;
    recordStorefrontVisit(slug);
    // Fires once per mount only — not on every internal route change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col">
        {/* Header Skeleton */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-10 w-96 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </header>

        {/* Page Banner Skeleton */}
        <div className="h-32 bg-slate-50 border-b border-slate-200/80 px-8 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-20 w-48 rounded-2xl" />
        </div>

        {/* Main Content Skeleton */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-[520px] w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-9 space-y-6">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-2xl" />
                ))}
              </div>
            </div>
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

  // Extract unique category names from real products
  const categories = Array.from(
    new Set(products.map((p) => p.category?.name).filter(Boolean))
  ) as string[];

  const handleAddToCart = (product: Product) => {
    dispatch(addToCart({ product, quantity: 1, storeSlug: slug }));
  };

  return (
    <>
      {storeSeo?.jsonLdSchema && (
        <JsonLdScript schema={storeSeo.jsonLdSchema} id="storefront-shop-jsonld" />
      )}
      <StorefrontPixelTracker
        facebookPixelId={(store as any).facebookPixelId}
        tiktokPixelId={(store as any).tiktokPixelId}
        googleTagManagerId={(store as any).googleTagManagerId}
      />
      <CartDrawer primaryColor={primaryColor} />
      <ProductDetailModal
        product={selectedProduct}
        storeSlug={slug}
        primaryColor={primaryColor}
        onClose={() => setSelectedProduct(null)}
      />
      <React.Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <ShopEaseShopView
          storeName={store.name}
          slug={store.slug}
          category={store.category}
          phone={store.phone}
          address={store.address}
          logo={store.logo}
          primaryColor={primaryColor}
          products={products}
          categories={categories}
          facebookUrl={(store as any).facebookUrl}
          instagramUrl={(store as any).instagramUrl}
          twitterUrl={(store as any).twitterUrl}
          youtubeUrl={(store as any).youtubeUrl}
          footerDescription={(store as any).footerDescription}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onAddToCart={handleAddToCart}
        />
      </React.Suspense>
    </>
  );
}
