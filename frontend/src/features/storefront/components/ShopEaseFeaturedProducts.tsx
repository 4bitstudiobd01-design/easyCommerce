'use client';

import React from 'react';
import Link from 'next/link';
import { ShopEaseProductCard } from './ShopEaseProductCard';
import { ShopEaseProduct, SHOPEASE_FEATURED_PRODUCTS } from '../data/defaultStorefrontData';
import { Package } from 'lucide-react';

interface ShopEaseFeaturedProductsProps {
  products?: ShopEaseProduct[];
  storeSlug?: string;
  primaryColor?: string;
  onOpenDetail?: (product: ShopEaseProduct) => void;
}

export const ShopEaseFeaturedProducts = ({
  products = [],
  storeSlug = 'main',
  primaryColor = '#2563eb',
  onOpenDetail,
}: ShopEaseFeaturedProductsProps) => {
  const displayProducts = products;

  return (
    <section id="featured-products" className="py-14 sm:py-18 bg-slate-50/60 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION TITLE */}
        <div className="text-center mb-10 sm:mb-12 space-y-2.5">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-2xs"
            style={{ backgroundColor: `${primaryColor}14`, color: primaryColor, border: `1px solid ${primaryColor}33` }}
          >
            <span>🛍️ All Products</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Browse the Full Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            Every item in the store — filter by category above or search to narrow it down.
          </p>
        </div>

        {/* PRODUCTS GRID */}
        {displayProducts.length === 0 ? (
          <div className="p-12 sm:p-16 bg-white rounded-3xl border border-slate-200/80 text-center max-w-md mx-auto my-6 space-y-3.5 shadow-sm">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-2xs"
              style={{ backgroundColor: `${primaryColor}14`, color: primaryColor, border: `1px solid ${primaryColor}22` }}
            >
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
                  primaryColor={primaryColor}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>

            {/* VIEW ALL PRODUCTS BUTTON */}
            <div className="text-center mt-10 sm:mt-12">
              <Link
                href={`/store/${storeSlug}/shop`}
                className="px-8 py-3.5 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md inline-flex items-center gap-2 transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -8px ${primaryColor}66` }}
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
