'use client';

import React from 'react';
import Link from 'next/link';
import { ShopEaseProductCard } from './ShopEaseProductCard';
import { ShopEaseProduct } from '../data/defaultStorefrontData';

interface ShopEaseProductSectionProps {
  /** DOM id for in-page anchor scrolling. */
  id?: string;
  /** Small pill above the heading, e.g. "🆕 Just In". */
  badge?: string;
  title: string;
  subtitle?: string;
  products: ShopEaseProduct[];
  storeSlug?: string;
  primaryColor?: string;
  onOpenDetail?: (product: ShopEaseProduct) => void;
  /** Alternating background for visual rhythm between stacked sections. */
  tone?: 'white' | 'muted';
  /** Hide the whole section when there are no products (curated sections do this). */
  hideWhenEmpty?: boolean;
  viewAllHref?: string;
}

/**
 * One curated storefront row (Hero/Featured, New Arrivals, Best Sellers, or the
 * full catalog). Products come pre-filtered and pre-ordered by the backend
 * (homepageSections + the merchant's sortOrder from the reorder modal).
 */
export const ShopEaseProductSection = ({
  id,
  badge,
  title,
  subtitle,
  products,
  storeSlug = 'main',
  primaryColor = '#2563eb',
  onOpenDetail,
  tone = 'white',
  hideWhenEmpty = false,
  viewAllHref,
}: ShopEaseProductSectionProps) => {
  if (hideWhenEmpty && products.length === 0) return null;

  return (
    <section
      id={id}
      className={`py-14 sm:py-18 border-b border-slate-100 ${
        tone === 'muted' ? 'bg-slate-50/60' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 space-y-2.5">
          {badge && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-2xs"
              style={{
                backgroundColor: `${primaryColor}14`,
                color: primaryColor,
                border: `1px solid ${primaryColor}33`,
              }}
            >
              <span>{badge}</span>
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">{subtitle}</p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="p-12 sm:p-16 bg-white rounded-3xl border border-slate-200/80 text-center max-w-md mx-auto my-6 space-y-3.5 shadow-sm">
            <h3 className="font-black text-lg text-slate-900">No Products Listed Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              This store is currently setting up its catalog. Please check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {products.map((product) => (
                <ShopEaseProductCard
                  key={product.id}
                  product={product}
                  storeSlug={storeSlug}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>

            {viewAllHref && (
              <div className="text-center mt-10 sm:mt-12">
                <Link
                  href={viewAllHref}
                  className="px-8 py-3.5 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md inline-flex items-center gap-2 transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -8px ${primaryColor}66` }}
                >
                  <span>View Full Catalog</span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
