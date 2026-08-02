'use client';

import React, { useState } from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../slices/cartSlice';
import { ProductReviewsSection } from './ProductReviewsSection';
import { ShoppingBag, X, Plus, Minus, CheckCircle2, ShieldCheck, Image as ImageIcon } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

  const hasDiscount =
    product.compareAtPrice && Number(product.compareAtPrice) > Number(product.basePrice);

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image Frame */}
          <div className="bg-slate-100 p-8 flex items-center justify-center aspect-square">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.title}
                className="w-full h-full object-contain max-h-96 rounded-2xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <ImageIcon className="w-12 h-12" />
                <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-8 flex flex-col justify-between">
            <div>
              {/* Category */}
              {product.category?.name && (
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-2">
                  {product.category.name}
                </span>
              )}

              {/* Title */}
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {product.title}
              </h2>

              {/* SKU & Stock Badge */}
              <div className="flex items-center gap-3 mt-3">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>In Stock</span>
                </span>
                <span className="font-mono text-xs text-slate-400">
                  SKU: {product.variants?.[0]?.sku || 'DEFAULT'}
                </span>
              </div>

              {/* Price Display */}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  ৳{Number(product.basePrice).toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-base text-slate-400 line-through">
                    ৳{Number(product.compareAtPrice).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Quantity Modifier & Add to Cart */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-slate-200 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 font-bold text-slate-900 text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-slate-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add {quantity} to Cart • ৳{(Number(product.basePrice) * quantity).toLocaleString()}</span>
              </button>
            </div>

            {/* PRODUCT REVIEWS & 5-STAR RATINGS SECTION */}
            <ProductReviewsSection productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
