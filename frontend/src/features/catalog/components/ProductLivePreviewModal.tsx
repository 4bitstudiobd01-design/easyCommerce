'use client';

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Check,
  Search,
  User,
  ChevronDown,
  Minus,
  Plus,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';

interface ProductLivePreviewModalProps {
  form: ProductFormState;
  isOpen: boolean;
  onClose: () => void;
}

// Mirrors the real storefront product page 1:1 (frontend/src/app/store/[slug]/product/[productSlug]/page.tsx
// + ShopEaseNavbar), so merchants see exactly what customers will see — same layout, same
// tenant primaryColor, same trust badges, same empty-reviews state. Header/account/cart are
// static mocks (no live cart or customer session should leak into a preview).
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
    store,
    categories,
    categoryId,
    brands,
    brandId,
    sku,
    hasVariants,
    weight,
    weightUnit,
    categoryAttributes,
    attributeValues,
    isVisible,
  } = form;

  const primaryColor = store?.primaryColor || '#2563eb';
  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  const brandName = brands.find((b) => b.id === brandId)?.name;
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

  const activeCustomSpecs = categoryAttributes
    .filter((a) => !a.isVariantOption && attributeValues[a.id])
    .map((a) => ({
      name: a.name,
      value: String(attributeValues[a.id]),
    }));
  if (weight) {
    activeCustomSpecs.push({ name: 'Package Weight', value: `${weight} ${weightUnit}` });
  }

  const storeName = store?.name || 'Your Store';

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
                Previewing: <span className="text-slate-800 font-semibold">{storeName}</span>
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
            className={`transition-all duration-300 bg-slate-50 text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans ${
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

            {/* Storefront Header (static mock of ShopEaseNavbar — no live cart/session) */}
            <div className="bg-white border-b border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {store?.logo ? (
                    <img
                      src={store.logo}
                      alt={storeName}
                      className="w-8 h-8 object-contain rounded-lg border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {storeName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-black text-slate-900 tracking-tight leading-tight">
                      {storeName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[9px] font-bold text-slate-400 tracking-wide truncate">
                        Official Storefront
                      </span>
                    </span>
                  </div>
                </div>

                {deviceMode === 'desktop' && (
                  <div className="hidden md:flex flex-1 max-w-sm">
                    <div className="flex items-center w-full bg-white border border-slate-200 rounded-xl h-9 px-1.5">
                      <Search className="w-3.5 h-3.5 text-slate-400 mx-2" />
                      <span className="flex-1 text-xs font-medium text-slate-400">Search in {storeName}...</span>
                      <span
                        className="h-6 px-3 text-white text-[11px] font-bold rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Search
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold">
                    <User className="w-3 h-3" />
                    <span>Sign In</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </span>
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>৳0</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Product View Body */}
            <div className="p-4 sm:p-6">
              {/* Breadcrumb */}
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 flex-wrap mb-4">
                <span className="hover:text-slate-900">Home</span>
                <span className="text-slate-300">/</span>
                {categoryName && (
                  <>
                    <span>{categoryName}</span>
                    <span className="text-slate-300">/</span>
                  </>
                )}
                <span className="text-slate-900 truncate max-w-[220px]">{displayTitle}</span>
              </div>

              <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-4 sm:p-6">
                <div className={`grid gap-6 ${deviceMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {/* Left Column: Image Gallery */}
                  <div className="space-y-3">
                    <div className="relative aspect-square w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
                      <img
                        src={activeImage}
                        alt={displayTitle}
                        className="w-full h-full object-contain"
                      />
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md">
                          {discountPercent}% OFF
                        </div>
                      )}
                    </div>

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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      {brandName && (
                        <span className="font-bold text-blue-600 uppercase tracking-wider text-[10.5px]">
                          {brandName}
                        </span>
                      )}
                      <span className="text-slate-400 text-[11px] ml-auto">
                        SKU: <strong className="text-slate-700">{sku || 'SKU-DEFAULT'}</strong>
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight">
                      {displayTitle}
                    </h1>

                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px]">
                        <Check className="w-3 h-3" />
                        <span>In Stock</span>
                      </span>
                    </div>

                    <div
                      className="p-3.5 rounded-2xl border text-slate-900 flex items-baseline gap-3"
                      style={{ backgroundColor: `${primaryColor}0d`, borderColor: `${primaryColor}33` }}
                    >
                      <span className="text-2xl font-black">৳{displayPrice.toLocaleString()}</span>
                      {hasDiscount && (
                        <span className="text-sm font-semibold text-slate-400 line-through">
                          ৳{numericComparePrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Sample Variants (if enabled) */}
                    {hasVariants && (
                      <>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block mb-1.5">Color:</span>
                          <div className="flex flex-wrap gap-2">
                            {['Black', 'Navy Blue', 'Maroon'].map((c) => {
                              const isSelected = (selectedVariantOptions.color || 'Black') === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setSelectedVariantOptions((prev) => ({ ...prev, color: c }))}
                                  className="px-3 py-1.5 text-xs font-bold rounded-xl border transition-all"
                                  style={
                                    isSelected
                                      ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' }
                                      : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#334155' }
                                  }
                                >
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-bold text-slate-800 block mb-1.5">Size:</span>
                          <div className="flex flex-wrap gap-2">
                            {['S', 'M', 'L', 'XL', 'XXL'].map((s) => {
                              const isSelected = (selectedVariantOptions.size || 'M') === s;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setSelectedVariantOptions((prev) => ({ ...prev, size: s }))}
                                  className="px-3 py-1.5 text-xs font-bold rounded-xl border transition-all"
                                  style={
                                    isSelected
                                      ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' }
                                      : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#334155' }
                                  }
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {description.trim() && (
                      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
                    )}

                    {/* Quantity & Add to Cart */}
                    <div className="pt-2 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                            className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-xs font-extrabold text-slate-900">
                            {selectedQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                            className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="flex-1 h-11 px-4 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                          style={{ backgroundColor: primaryColor, boxShadow: `0 10px 24px -8px ${primaryColor}80` }}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Add {selectedQuantity} to Cart • ৳{(displayPrice * selectedQuantity).toLocaleString()}</span>
                        </button>
                      </div>
                    </div>

                    {/* Trust Highlights */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                      <div className="p-2.5 bg-slate-50 rounded-xl">
                        <Truck className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                        <span className="text-[10px] font-bold text-slate-700 block">Fast Delivery</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl">
                        <ShieldCheck className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                        <span className="text-[10px] font-bold text-slate-700 block">100% Authentic</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl">
                        <RotateCcw className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                        <span className="text-[10px] font-bold text-slate-700 block">7-Day Return</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                {activeCustomSpecs.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Specifications</h3>
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
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reviews (empty state — matches real ProductReviewsSection before any reviews exist) */}
                <div className="space-y-6 mt-8 pt-6 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-black text-slate-900 tracking-tight">5.0</div>
                      <div>
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-slate-200" />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">Based on 0 reviews</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto opacity-60 cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Write a Review</span>
                    </button>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                    <MessageSquare className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No reviews yet for this product</p>
                    <p className="text-[11px] text-slate-400">Be the first to share your experience!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
