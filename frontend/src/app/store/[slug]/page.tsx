'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetPublicStoreProductsQuery } from '@/features/storefront/api/storefrontApi';
import { StorefrontNavbar } from '@/features/storefront/components/StorefrontNavbar';
import { ProductCard } from '@/features/storefront/components/ProductCard';
import { ProductDetailModal } from '@/features/storefront/components/ProductDetailModal';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { StorefrontPixelTracker } from '@/features/storefront/components/StorefrontPixelTracker';
import { toggleCartDrawer } from '@/features/storefront/slices/cartSlice';
import { Product } from '@/features/catalog/api/catalogApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  Store,
  Package,
  Sparkles,
  Truck,
  ShieldCheck,
  CreditCard,
  Headphones,
  ShoppingBag,
  ArrowRight,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ProductCardSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function StorefrontPage() {
  const params = useParams();
  const slug = (params.slug as string) || '';
  const dispatch = useDispatch();

  const { data, isLoading, isError } = useGetPublicStoreProductsQuery(slug, {
    skip: !slug,
  });

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
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
  const primaryColor = (store as any).primaryColor || '#2563eb';
  const heroBanners = (store as any).heroBanners || [];

  // Extract unique category names
  const categories = Array.from(
    new Set(products.map((p) => p.category?.name).filter(Boolean))
  ) as string[];

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT MARQUEE BAR */}
      <div className="bg-slate-950 text-slate-300 text-[11px] font-semibold py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-hidden">
            <span className="flex items-center gap-1.5 shrink-0">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fast Delivery Across Bangladesh (Dhaka ৳60 / Outside ৳120)</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>100% Authentic Quality Guaranteed</span>
            </span>
          </div>
          <span className="font-bold text-white text-[10px] bg-blue-600 px-2 py-0.5 rounded-full shrink-0">
            Cash on Delivery Available
          </span>
        </div>
      </div>

      {/* DYNAMIC PIXEL & TRACKING INJECTOR */}
      <StorefrontPixelTracker
        facebookPixelId={(store as any).facebookPixelId}
        tiktokPixelId={(store as any).tiktokPixelId}
        googleTagManagerId={(store as any).googleTagManagerId}
      />

      {/* 2. STOREFRONT NAVBAR */}
      <StorefrontNavbar
        storeName={store.name}
        slug={store.slug}
        category={store.category}
        phone={store.phone}
        address={store.address}
        logo={store.logo}
        primaryColor={primaryColor}
      />

      {/* CART DRAWER & PRODUCT MODAL */}
      <CartDrawer />
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* 3. MAIN STOREFRONT CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        {/* HERO BANNER SECTION */}
        {heroBanners.length > 0 ? (
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white min-h-[300px] border border-slate-800 shadow-2xl flex items-center">
            <img
              src={heroBanners[0].imageUrl}
              alt={heroBanners[0].title}
              className="absolute inset-0 w-full h-full object-cover opacity-45 transform hover:scale-105 transition-transform duration-700"
            />
            <div className="relative z-10 p-8 md:p-14 space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Featured Collection 2026</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {heroBanners[0].title}
              </h1>
              <p className="text-slate-200 text-sm md:text-base font-medium leading-relaxed">
                {heroBanners[0].subtitle}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative overflow-hidden rounded-3xl text-white p-8 md:p-14 border shadow-2xl"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/20 rounded-full text-white text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verified Merchant Storefront</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  {store.name}
                </h1>
                <p className="text-slate-100 text-sm md:text-base max-w-2xl font-normal leading-relaxed">
                  {(store as any).metaDescription || 'Discover premium products, exclusive deals, and fast delivery across Bangladesh.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
                  <span className="block text-3xl font-black text-white leading-none">
                    {products.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-100 uppercase tracking-wider block mt-1">
                    Products Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRUST & FEATURE HIGHLIGHTS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 block">Fast BD Delivery</span>
              <span className="text-[10px] text-slate-400">Within 24-48 Hours</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 block">100% Authentic</span>
              <span className="text-[10px] text-slate-400">Verified Store Quality</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 block">Cash on Delivery</span>
              <span className="text-[10px] text-slate-400">Pay When Received</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 block">24/7 Support</span>
              <span className="text-[10px] text-slate-400">Dedicated Customer Help</span>
            </div>
          </div>
        </div>

        {/* 5. SEARCH & CATEGORY FILTER BAR */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pr-2">
              <button
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  backgroundColor: selectedCategory === 'ALL' ? primaryColor : 'white',
                  color: selectedCategory === 'ALL' ? 'white' : '#334155',
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border border-slate-200 shadow-sm"
              >
                All Products ({products.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: selectedCategory === cat ? primaryColor : 'white',
                    color: selectedCategory === cat ? 'white' : '#334155',
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border border-slate-200 shadow-sm"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Live Search Bar */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog items..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>

          <span className="text-xs font-bold text-slate-400 block">
            Showing {filteredProducts.length} items
          </span>
        </div>

        {/* 6. PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-8 space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">No Matching Products Found</h3>
            <p className="text-xs text-slate-500">
              Try searching with another keyword or select a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                primaryColor={primaryColor}
                onOpenDetail={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 7. FLOATING QUICK CART BUTTON */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <button
            onClick={() => dispatch(toggleCartDrawer(true))}
            style={{ backgroundColor: primaryColor }}
            className="px-5 py-3.5 text-white font-extrabold text-xs rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all border-2 border-white"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-white text-slate-900 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {totalItemCount}
              </span>
            </div>
            <span>View Cart • ৳{subtotal.toLocaleString()} BDT</span>
          </button>
        </div>
      )}

      {/* 8. PROFESSIONAL E-COMMERCE FOOTER */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <span className="text-white font-black text-lg block">{store.name}</span>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Official online storefront powered by EasyCommerce Cloud. Enjoy fast delivery and secure payments across Bangladesh.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-white font-extrabold block">Customer Helpline & Location</span>
            {store.phone && <p className="text-slate-300">📞 Phone: {store.phone}</p>}
            {store.address && <p className="text-slate-300">📍 Address: {store.address}</p>}
          </div>

          <div className="space-y-2">
            <span className="text-white font-extrabold block">Accepted Payment Methods</span>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-1 bg-slate-800 text-white font-bold text-[10px] rounded-lg border border-slate-700">SSLCommerz</span>
              <span className="px-2.5 py-1 bg-slate-800 text-pink-400 font-bold text-[10px] rounded-lg border border-slate-700">bKash</span>
              <span className="px-2.5 py-1 bg-slate-800 text-orange-400 font-bold text-[10px] rounded-lg border border-slate-700">Nagad</span>
              <span className="px-2.5 py-1 bg-slate-800 text-emerald-400 font-bold text-[10px] rounded-lg border border-slate-700">Cash on Delivery</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 mt-8 pt-6 text-center text-[11px] text-slate-500">
          <p>&copy; 2026 <span className="font-bold text-slate-300">{store.name}</span>. All rights reserved. EasyCommerce Cloud.</p>
        </div>
      </footer>
    </div>
  );
}
