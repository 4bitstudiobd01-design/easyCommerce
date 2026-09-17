'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ImageOff } from 'lucide-react';
import type { Product } from '@/features/catalog/api/catalogApi';

interface RelatedProductsCarouselProps {
  products: Product[];
  storeSlug: string;
  primaryColor: string;
}

export function RelatedProductsCarousel({
  products,
  storeSlug,
  primaryColor,
}: RelatedProductsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">You might also like</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
            aria-label="Scroll left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
            aria-label="Scroll right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => {
          const img = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
          const price = Number(p.basePrice || 0);
          const compareAt = p.compareAtPrice ? Number(p.compareAtPrice) : 0;
          const hasDiscount = compareAt > price;
          return (
            <Link
              key={p.id}
              href={`/store/${storeSlug}/product/${p.slug || p.id}`}
              className="group shrink-0 w-56 snap-start space-y-3"
            >
              <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                {img ? (
                  <img
                    src={img}
                    alt={p.title || p.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ImageOff className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="space-y-1">
                <h3
                  className="text-sm font-bold text-slate-800 line-clamp-1 transition-colors group-hover:[color:var(--hover)]"
                  style={{ ['--hover' as any]: primaryColor }}
                >
                  {p.title || p.name || 'Product Name'}
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-black text-slate-900">
                    ৳{price.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] text-slate-400 line-through font-semibold">
                      ৳{compareAt.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
