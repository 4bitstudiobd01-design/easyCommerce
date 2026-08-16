'use client';

import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { addToCart } from '../slices/cartSlice';
import { ShopEaseProduct } from '../data/defaultStorefrontData';

interface ShopEaseProductCardProps {
  product: ShopEaseProduct;
  storeSlug?: string;
  onOpenDetail?: (product: ShopEaseProduct) => void;
}

export const ShopEaseProductCard = ({
  product,
  storeSlug = 'main',
  onOpenDetail,
}: ShopEaseProductCardProps) => {
  const dispatch = useDispatch();

  const firstImg = product.images?.[0];
  const imageUrl =
    (typeof firstImg === 'string' ? firstImg : firstImg?.url) ||
    (product as any).imageUrl ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80';

  const price = Number((product as any).price ?? product.basePrice) || 0;
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const hasDiscount = Boolean(compareAtPrice && compareAtPrice > price);
  const rating = product.rating || 4.6;
  const reviewsCount = product.reviewsCount || 48;

  // Determine badge text and color
  let badgeText = product.badge;
  let isDiscountBadge = product.badgeType === 'discount' || hasDiscount;
  if (!badgeText && hasDiscount && compareAtPrice) {
    const discountPct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
    badgeText = `-${discountPct}%`;
    isDiscountBadge = true;
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(
      addToCart({
        product,
        quantity: 1,
        storeSlug,
      })
    );
    toast.success(`Added ${product.name || product.title} to cart!`);
  };

  return (
    <div
      onClick={() => onOpenDetail?.(product)}
      className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      {/* 1. TOP BADGE */}
      <div className="absolute top-3.5 left-3.5 z-10">
        {badgeText && (
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide shadow-2xs ${
              isDiscountBadge
                ? 'bg-rose-500 text-white'
                : badgeText.toLowerCase().includes('best')
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* 2. PRODUCT IMAGE */}
      <div className="w-full h-44 rounded-xl bg-slate-50/50 flex items-center justify-center p-3 mb-3 overflow-hidden group-hover:bg-slate-50 transition-colors">
        <img
          src={imageUrl}
          alt={product.name || product.title}
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* 3. PRODUCT TITLE */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
          {product.name || product.title}
        </h3>

        {/* 4. PRICE ROW */}
        <div className="flex items-baseline gap-1.5 pt-1">
          <span
            className={`font-black text-sm sm:text-base ${
              hasDiscount ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            ৳{price.toLocaleString('en-US')}
          </span>
          {hasDiscount && compareAtPrice && (
            <span className="text-xs text-slate-400 line-through font-semibold">
              ৳{compareAtPrice.toLocaleString('en-US')}
            </span>
          )}
        </div>

        {/* 5. RATING ROW */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80 mt-1.5">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-extrabold text-slate-800">{rating}</span>
            <span className="text-[11px] font-medium text-slate-400">({reviewsCount})</span>
          </div>
        </div>

        {/* 6. FULL ADD TO CART BUTTON */}
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={`Add ${product.name || product.title} to cart`}
          className="w-full mt-2.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-blue-500/20"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};
