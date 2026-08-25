'use client';

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Check,
  Share2,
  Heart,
  Tag,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';

interface ProductLivePreviewModalProps {
  form: ProductFormState;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductLivePreviewModal({ form, isOpen, onClose }: ProductLivePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const {
    name,
    description,
    localImages,
    numericBasePrice,
    compareAtPrice,
    currencySymbol,
    store,
    categories,
    categoryId,
    brands,
    brandId,
    sku,
    trackInventory,
    initialStock,
    hasVariants,
    sourceProduct,
    weight,
    weightUnit,
    categoryAttributes,
    attributeValues,
    isVisible,
  } = form;

  const categoryName = categories.find((c) => c.id === categoryId)?.name || 'General';
  const brandName = brands.find((b) => b.id === brandId)?.name || store?.name || 'Rohi Style';
  const displayTitle = name.trim() || 'Untitled Product';
  const displayPrice = numericBasePrice > 0 ? numericBasePrice : 1450;
  const numericComparePrice = Number(compareAtPrice) || 0;
  const hasDiscount = numericComparePrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((numericComparePrice - displayPrice) / numericComparePrice) * 100)
    : 0;

  const images = localImages.length > 0
    ? localImages
    : [{ url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', altText: 'Sample Product' }];

  const activeImage = images[selectedImageIndex]?.url || images[0]?.url;

  // Custom attributes to display in specs
  const activeCustomSpecs = categoryAttributes
    .filter((a) => !a.isVariantOption && attributeValues[a.id])
    .map((a) => ({
      name: a.name,
      value: String(attributeValues[a.id]),
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">Live Storefront Preview</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                  Customer View
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Previewing: <span className="text-slate-800 font-semibold">{store?.name || 'RohiFashon'}</span>
              </p>
            </div>
          </div>

          {/* Device Mode Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                deviceMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                deviceMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Canvas Area */}
        <div className="flex-1 bg-slate-100/60 p-3 sm:p-6 overflow-y-auto flex items-start justify-center">
          <div
            className={`transition-all duration-300 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden ${
              deviceMode === 'mobile' ? 'w-full max-w-[420px] my-auto' : 'w-full max-w-4xl'
            }`}
          >
            {!isVisible && (
              <div className="px-4 py-2.5 bg-amber-50 text-amber-700 border-b border-amber-200 flex items-center gap-2 text-[11px] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Hidden from storefront — this product won&apos;t appear on your storefront until &quot;Show on storefront&quot; is enabled.
                </span>
              </div>
            )}

            {/* Store Top Banner Mock */}
            <div className="bg-slate-900 text-white px-4 py-2 text-[11px] flex items-center justify-between border-b border-slate-800">
              <span className="font-extrabold tracking-tight text-blue-400">
                {store?.name || 'RohiFashon'}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                🚚 Free shipping on orders over ৳2,000
              </span>
              <span className="text-[10px] text-slate-300">BDT ({currencySymbol})</span>
            </div>

            {/* Breadcrumb */}
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
              <span>Home</span>
              <span>/</span>
              <span>{categoryName}</span>
              <span>/</span>
              <span className="font-semibold text-slate-800 truncate">{displayTitle}</span>
            </div>

            {/* Product View Body */}
            <div className="p-5 sm:p-8">
              <div className={`grid gap-8 ${deviceMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'}`}>
                {/* Left Column: Image Gallery */}
                <div className={deviceMode === 'mobile' ? 'col-span-1' : 'md:col-span-6 space-y-3'}>
                  {/* Main Large Image */}
                  <div className="relative aspect-square w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
                    <img
                      src={activeImage}
                      alt={displayTitle}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    {hasDiscount && (
                      <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md">
                        {discountPercent}% OFF
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                            selectedImageIndex === idx
                              ? 'border-blue-600 ring-2 ring-blue-600/20'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Details, Price & Actions */}
                <div className={deviceMode === 'mobile' ? 'col-span-1 space-y-4' : 'md:col-span-6 space-y-4'}>
                  {/* Brand & Category */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600 uppercase tracking-wider text-[10.5px]">
                      {brandName}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      SKU: <strong className="text-slate-700">{sku || 'SKU-DEFAULT'}</strong>
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-xl font-extrabold text-slate-900 leading-snug">
                    {displayTitle}
                  </h1>

                  {/* Rating & Stock */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>5.0</span>
                      <span className="text-slate-400 font-normal">(12 reviews)</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px]">
                      <Check className="w-3 h-3" />
                      <span>In Stock</span>
                    </span>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-baseline gap-3">
                    <span className="text-2xl font-black text-slate-900">
                      {currencySymbol}{displayPrice.toLocaleString()}
                    </span>
                    {numericComparePrice > displayPrice && (
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        {currencySymbol}{numericComparePrice.toLocaleString()}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        Save {currencySymbol}{(numericComparePrice - displayPrice).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Sample Variants (if enabled) */}
                  {hasVariants && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block mb-1.5">Color:</span>
                        <div className="flex flex-wrap gap-2">
                          {['Black', 'Navy Blue', 'Maroon'].map((c, i) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setSelectedVariantOptions((prev) => ({ ...prev, color: c }))}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                (selectedVariantOptions.color || 'Black') === c
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-800 block mb-1.5">Size:</span>
                        <div className="flex flex-wrap gap-2">
                          {['S', 'M', 'L', 'XL', 'XXL'].map((s, i) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSelectedVariantOptions((prev) => ({ ...prev, size: s }))}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                (selectedVariantOptions.size || 'M') === s
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity & Buy Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center gap-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                          className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-xs font-extrabold text-slate-900">
                          {selectedQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                          className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          +
                        </button>
                      </div>

                      {/* Add to Cart */}
                      <button
                        type="button"
                        className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>

                    {/* Direct Buy Now */}
                    <button
                      type="button"
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Order Now (Cash on Delivery)</span>
                    </button>
                  </div>

                  {/* Trust Highlights */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <Truck className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700 block">Fast Delivery</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <ShieldCheck className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700 block">100% Authentic</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <RotateCcw className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700 block">7-Day Return</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Specifications Tabs/Sections */}
              <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Product Description</h3>
                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {description.trim() || 'No detailed description provided yet. Write features in General section to showcase here.'}
                </div>

                {/* Custom Specifications Table */}
                {activeCustomSpecs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Specifications & Details
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full">
                        <tbody className="divide-y divide-slate-100">
                          {activeCustomSpecs.map((spec, i) => (
                            <tr key={i} className="even:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-700 w-1/3 bg-slate-50/80">
                                {spec.name}
                              </td>
                              <td className="p-2.5 text-slate-900 font-medium">
                                {spec.value}
                              </td>
                            </tr>
                          ))}
                          {weight && (
                            <tr>
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/80">Package Weight</td>
                              <td className="p-2.5 text-slate-900 font-medium">{weight} {weightUnit}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
