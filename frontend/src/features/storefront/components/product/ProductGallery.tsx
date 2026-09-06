'use client';

import React, { useMemo, useState } from 'react';
import { ImageOff, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { ProductImage } from '@/features/catalog/api/catalogApi';

interface ProductGalleryProps {
  images: (ProductImage | string | any)[];
  /** Controlled active index (e.g. driven by a colour selection). */
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  primaryColor: string;
  discountPercent?: number;
  badgeLabel?: string;
  alt: string;
}

/**
 * Product gallery: a thumbnail rail beside a main frame. The main frame keeps the
 * image fully visible (`object-contain`) and is height-capped so a tall product
 * shot doesn't leave a large empty square. Handles string[], ProductImage[], and
 * `{ url | imageUrl | src }` shapes so it stays fully data-driven.
 */
export function ProductGallery({
  images,
  activeIndex,
  onActiveIndexChange,
  primaryColor,
  discountPercent,
  badgeLabel,
  alt,
}: ProductGalleryProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const normalizedImages = useMemo(() => {
    if (!images || !Array.isArray(images) || images.length === 0) return [];
    return images
      .map((img: any, idx: number) => {
        if (!img) return null;
        const url = typeof img === 'string' ? img : img.url || img.imageUrl || img.src || '';
        if (!url) return null;
        return {
          id: img && typeof img === 'object' && img.id ? String(img.id) : `img-${idx}`,
          url,
        };
      })
      .filter((img): img is { id: string; url: string } => Boolean(img?.url));
  }, [images]);

  const safeIndex = Math.min(
    Math.max(activeIndex, 0),
    Math.max(normalizedImages.length - 1, 0),
  );
  const activeUrl = normalizedImages[safeIndex]?.url || normalizedImages[0]?.url;
  const hasMultiple = normalizedImages.length > 1;

  const go = (dir: -1 | 1) => {
    if (!hasMultiple) return;
    const next = (safeIndex + dir + normalizedImages.length) % normalizedImages.length;
    onActiveIndexChange(next);
  };

  return (
    <>
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 w-full self-start">
        {/* Thumbnail rail */}
        {hasMultiple && (
          <div className="flex sm:flex-col gap-2.5 overflow-auto pb-1 sm:pb-0 pr-1 shrink-0 scrollbar-none">
            {normalizedImages.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => onActiveIndexChange(idx)}
                className="w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-2xl overflow-hidden border-2 shrink-0 bg-white transition-all hover:opacity-90 cursor-pointer"
                style={
                  safeIndex === idx
                    ? { borderColor: primaryColor, boxShadow: `0 0 0 3px ${primaryColor}22` }
                    : { borderColor: '#e2e8f0' }
                }
                aria-label={`View image ${idx + 1}`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main frame — height is driven purely by the image itself (no aspect
            box, no flex stretch), so there's never an empty strip below it.
            Badges/controls overlay the photo. */}
        <div
          className="relative flex-1 min-w-0 rounded-[28px] overflow-hidden border group"
          style={{
            backgroundColor: `${primaryColor}08`,
            borderColor: `${primaryColor}1f`,
          }}
        >
          {activeUrl ? (
            <img
              src={activeUrl}
              alt={alt}
              className="block w-full h-auto max-h-[560px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300 gap-2 aspect-square">
              <ImageOff className="w-10 h-10" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                No Image Available
              </span>
            </div>
          )}

          {/* Badges */}
          {(badgeLabel || (discountPercent && discountPercent > 0)) && (
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {badgeLabel && (
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {badgeLabel}
                </span>
              )}
              {discountPercent && discountPercent > 0 && (
                <span
                  className="text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm"
                  style={{ backgroundColor: primaryColor, filter: 'brightness(0.85)' }}
                >
                  -{discountPercent}%
                </span>
              )}
            </div>
          )}

          {/* Zoom */}
          {activeUrl && (
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors z-10"
              aria-label="Zoom image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Prev / next + dots */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {normalizedImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onActiveIndexChange(idx)}
                    className="h-1.5 rounded-full transition-all cursor-pointer"
                    style={{
                      backgroundColor: safeIndex === idx ? primaryColor : '#cbd5e1',
                      width: safeIndex === idx ? 18 : 6,
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {isZoomed && activeUrl && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={activeUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
        </div>
      )}
    </>
  );
}
