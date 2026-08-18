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
  products = [],
  storeSlug = 'main',
  onOpenDetail,
}: ShopEaseFeaturedProductsProps) => {
  const displayProducts = products;

  return (
    <section id="featured-products" className="py-14 sm:py-18 bg-slate-50/60 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION TITLE */}
        <div className="text-center mb-10 sm:mb-12 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-black uppercase tracking-wider shadow-2xs">
            <span>✨ Featured Collection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Trending Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            Discover verified items with fast doorstep delivery, genuine warranty, and instant checkout.
          </p>
        </div>

        {/* PRODUCTS GRID */}
        {displayProducts.length === 0 ? (
          <div className="p-12 sm:p-16 bg-white rounded-3xl border border-slate-200/80 text-center max-w-md mx-auto my-6 space-y-3.5 shadow-sm">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="font-black text-lg text-slate-900">No Products Listed Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              This store is currently setting up its product inventory. Please check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {displayProducts.map((product) => (
                <ShopEaseProductCard
                  key={product.id}
                  product={product}
                  storeSlug={storeSlug}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>

            {/* VIEW ALL PRODUCTS BUTTON */}
            <div className="text-center mt-10 sm:mt-12">
              <Link
                href={`/store/${storeSlug}/shop`}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>View Full Catalog</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
