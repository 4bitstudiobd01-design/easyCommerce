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
      className="group bg-white rounded-3xl border border-slate-100 hover:border-blue-300/80 p-3 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer relative active:scale-[0.98] select-none"
    >
      {/* 1. TOP BADGE */}
      {badgeText && (
        <div className="absolute top-4 left-4 z-10">
          <span
            className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black tracking-wider shadow-xs uppercase backdrop-blur-xs ${
              isDiscountBadge
                ? 'bg-rose-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {badgeText}
          </span>
        </div>
      )}

      {/* 2. PRODUCT IMAGE */}
      <div className="w-full h-36 sm:h-48 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/40 flex items-center justify-center p-3 mb-3 overflow-hidden group-hover:bg-blue-50/20 transition-colors">
        <img
          src={imageUrl}
          alt={product.name || product.title}
          className="w-full h-full object-contain transform group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* 3. PRODUCT TITLE */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
          {product.name || product.title}
        </h3>

        {/* 4. PRICE ROW */}
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span
            className={`font-black text-sm sm:text-base ${
              hasDiscount ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            ৳{price.toLocaleString('en-US')}
          </span>
          {hasDiscount && compareAtPrice && (
            <span className="text-[11px] text-slate-400 line-through font-semibold">
              ৳{compareAtPrice.toLocaleString('en-US')}
            </span>
          )}
        </div>

        {/* 5. RATING ROW */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-slate-800">{rating}</span>
            <span className="text-[10px] font-medium text-slate-400">({reviewsCount})</span>
          </div>
        </div>

        {/* 6. FULL ADD TO CART BUTTON */}
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={`Add ${product.name || product.title} to cart`}
          className="w-full mt-2.5 py-2 sm:py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs hover:shadow-md hover:shadow-blue-500/20 cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.2} />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};
