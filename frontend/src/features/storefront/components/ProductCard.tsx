'use client';

import React from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../slices/cartSlice';
import { ShoppingBag, Eye, Image as ImageIcon, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenDetail?: (product: Product) => void;
}

export function ProductCard({ product, onOpenDetail }: ProductCardProps) {
  const dispatch = useDispatch();

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

  const hasDiscount =
    product.compareAtPrice && Number(product.compareAtPrice) > Number(product.basePrice);

  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(product.compareAtPrice) - Number(product.basePrice)) /
          Number(product.compareAtPrice)) *
          100
      )
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }));
  };

  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(product)}
      className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Product Image Frame */}
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <ImageIcon className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-wider">No Image</span>
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white font-extrabold text-[10px] rounded-xl shadow-lg shadow-red-600/30">
              -{discountPercent}% OFF
            </div>
          )}

          {/* Hover Quick Action Overlay */}
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              onClick={handleAddToCart}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>

        {/* Card Body Details */}
        <div className="p-5">
          {/* Category Tag */}
          {product.category?.name ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1.5">
              {product.category.name}
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              General Catalog
            </span>
          )}

          {/* Product Title */}
          <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
        </div>
      </div>

      {/* Footer Price & Add Button */}
      <div className="p-5 pt-0 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-slate-900">
              ৳{Number(product.basePrice).toLocaleString()}
            </span>
          </div>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through block">
              ৳{Number(product.compareAtPrice).toLocaleString()}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl border border-blue-200/80 transition-colors"
          title="Add to Cart"
        >
          <ShoppingBag className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
