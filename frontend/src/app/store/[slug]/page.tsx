'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetPublicStoreProductsQuery } from '@/features/storefront/api/storefrontApi';
import { StorefrontNavbar } from '@/features/storefront/components/StorefrontNavbar';
import { ProductCard } from '@/features/storefront/components/ProductCard';
import { ProductDetailModal } from '@/features/storefront/components/ProductDetailModal';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { Product } from '@/features/catalog/api/catalogApi';
import { Store, Package, Sparkles, Tag, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';
import { ProductCardSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function StorefrontPage() {
  const params = useParams();
  const slug = (params.slug as string) || '';

  const { data, isLoading, isError } = useGetPublicStoreProductsQuery(slug, {
    skip: !slug,
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        {/* Skeleton Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </header>

        {/* Skeleton Body */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
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

  // Extract unique category names
  const categories = Array.from(
    new Set(products.map((p) => p.category?.name).filter(Boolean))
  ) as string[];

  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => p.category?.name === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Storefront Navbar */}
      <StorefrontNavbar
        storeName={store.name}
        slug={store.slug}
        category={store.category}
        phone={store.phone}
        address={store.address}
      />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Main Store Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Storefront Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-8 md:p-12 border border-slate-800 shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/30 via-transparent to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Verified Merchant Storefront</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {store.name}
              </h1>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl font-normal leading-relaxed">
                Discover premium products, exclusive deals, and fast delivery across Bangladesh.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                <span className="block text-2xl font-black text-white leading-none">
                  {products.length}
                </span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mt-1">
                  Products Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Items ({products.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-400 shrink-0">
            Showing {filteredProducts.length} items
          </span>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">No Products in this Category</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select another category or view all items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetail={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Store Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-medium">
          <p>&copy; 2026 <span className="font-bold text-slate-900">{store.name}</span>. Powered by EasyCommerce Cloud.</p>
        </div>
      </footer>
    </div>
  );
}
