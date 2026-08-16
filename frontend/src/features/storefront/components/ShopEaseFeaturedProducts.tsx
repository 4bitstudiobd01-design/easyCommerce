'use client';

import React from 'react';
import Link from 'next/link';
import { ShopEaseProductCard } from './ShopEaseProductCard';
import { ShopEaseProduct, SHOPEASE_FEATURED_PRODUCTS } from '../data/defaultStorefrontData';
import { Package } from 'lucide-react';

interface ShopEaseFeaturedProductsProps {
  products?: ShopEaseProduct[];
  storeSlug?: string;
  onOpenDetail?: (product: ShopEaseProduct) => void;
}

export const ShopEaseFeaturedProducts = ({
  products = SHOPEASE_FEATURED_PRODUCTS,
  storeSlug = 'main',
  onOpenDetail,
}: ShopEaseFeaturedProductsProps) => {
  const displayProducts = products.length > 0 ? products : SHOPEASE_FEATURED_PRODUCTS;

  return (
    <section id="featured-products" className="py-12 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION TITLE */}
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            <span>🔥 Handpicked Deals</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Featured & Trending Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            Discover top-rated products with exclusive discounts, genuine quality, and instant delivery.
          </p>
        </div>

        {/* PRODUCTS GRID (6 COLUMNS ON WIDE SCREENS) */}
        {displayProducts.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-6 space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">No Products Available</h3>
            <p className="text-xs text-slate-500">
              Stay tuned, new items will be added to this store soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {displayProducts.map((product) => (
              <ShopEaseProductCard
                key={product.id}
                product={product}
                storeSlug={storeSlug}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}

        {/* VIEW ALL PRODUCTS BUTTON */}
        <div className="text-center mt-8">
          <Link
            href={`/store/${storeSlug}/shop`}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 inline-flex items-center gap-2 transition-all"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};
