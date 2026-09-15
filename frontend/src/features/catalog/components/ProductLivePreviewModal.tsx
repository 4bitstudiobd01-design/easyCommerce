'use client';

import React, { useMemo, useState } from 'react';
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
  Minus,
  Plus,
  MessageSquare,
  AlertTriangle,
  Layers,
  Zap,
} from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { getVariantAttributeOptions, resolveVariant } from '@/features/storefront/utils/resolveProductVariant';

interface ProductLivePreviewModalProps {
  form: ProductFormState;
  isOpen: boolean;
  onClose: () => void;
}

// Mirrors the real storefront product page (frontend/src/app/store/[slug]/product/[productSlug]/page.tsx
// + ShopEaseNavbar), so merchants see exactly what customers will see — same layout, same tenant
// primaryColor, same trust badges, same variant/stock logic, same empty-reviews state.
// Header/account/cart are static mocks (no live cart or customer session leaks into a preview).
export function ProductLivePreviewModal({ form, isOpen, onClose }: ProductLivePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const {
    name,
    description,
    localImages,
    numericBasePrice,
    numericCompareAt,
    store,
    categories,
    categoryId,
    brands,
    brandId,
    sku,
    hasVariants,
    weight,
    weightUnit,
    taxRate,
    isTaxInclusive,
    trackInventory,
    allowBackorder,
    lowStockThreshold,
    initialStock,
    categoryAttributes,
    attributeValues,
    isVisible,
    isEditMode,
    sourceProduct,
    pendingVariants,
  } = form;

  // Edit mode reads the saved variants; create mode uses the combinations held in
  // form state (built locally, not yet saved). Both expose the same option shape
  // the resolver needs.
  const variants = useMemo(
    () =>
      isEditMode
        ? sourceProduct?.variants ?? []
        : pendingVariants.map((v, i) => ({
            id: v.combinationKey || `pending-${i}`,
            title: v.title,
            sku: v.sku,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            isEnabled: v.isEnabled,
            options: v.options,
          })),
    [isEditMode, sourceProduct?.variants, pendingVariants],
  );
  const attributeOptions = useMemo(() => getVariantAttributeOptions(variants), [variants]);
  const selectedVariant = useMemo(
    () => resolveVariant(variants, selectedOptions),
    [variants, selectedOptions],
  );
  const hasRealVariants = attributeOptions.length > 0;
  const variantSelectionComplete = !hasRealVariants || Boolean(selectedVariant);

  if (!isOpen) return null;

  const primaryColor = store?.primaryColor || '#2563eb';
  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  const brandName = brands.find((b) => b.id === brandId)?.name;
  const displayTitle = name.trim() || 'Untitled Product';

  // Selected variant price wins, then the product base price, then a demo figure.
  const basePriceNum = numericBasePrice > 0 ? numericBasePrice : 1450;
  const displayPrice = selectedVariant?.price != null ? Number(selectedVariant.price) : basePriceNum;
  const variantCompareAt = selectedVariant?.compareAtPrice != null ? Number(selectedVariant.compareAtPrice) : 0;
  const comparePrice = variantCompareAt > 0 ? variantCompareAt : numericCompareAt;
  const hasDiscount = comparePrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100)
    : 0;
  const displaySku = selectedVariant?.sku || sku;

  const images = localImages.length > 0
    ? localImages
    : [{ url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', altText: 'Sample Product' }];
  const activeImage = images[selectedImageIndex]?.url || images[0]?.url;

  // Stock state — mirrors ListProductsService / storefront stock badge logic.
  const stockState = (() => {
    if (!trackInventory) {
      return { label: 'In Stock', tone: 'ok' as const, canBuy: true };
    }
    const available =
      isEditMode && sourceProduct?.stockInfo
        ? sourceProduct.stockInfo.available
        : typeof initialStock === 'number'
          ? initialStock
          : 0;
    if (available <= 0) {
      return allowBackorder
        ? { label: 'Available on Backorder', tone: 'warn' as const, canBuy: true }
        : { label: 'Out of Stock', tone: 'bad' as const, canBuy: false };
    }
    if (available <= (lowStockThreshold || 0)) {
      return { label: `Only ${available} left`, tone: 'warn' as const, canBuy: true };
    }
    return { label: 'In Stock', tone: 'ok' as const, canBuy: true };
  })();

  const canAddToCart = stockState.canBuy && variantSelectionComplete;

  const stockToneClasses =
    stockState.tone === 'ok'
      ? 'bg-emerald-50 text-emerald-700'
      : stockState.tone === 'warn'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-rose-50 text-rose-700';

  const taxNote =
    taxRate > 0
      ? isTaxInclusive
        ? `Price includes ${taxRate}% VAT`
        : `+ ${taxRate}% VAT at checkout`
      : null;

  const activeCustomSpecs = categoryAttributes
    .filter((a) => !a.isVariantOption && attributeValues[a.id])
    .map((a) => ({ name: a.name, value: String(attributeValues[a.id]) }));
  if (weight) {
    activeCustomSpecs.push({ name: 'Package Weight', value: `${weight} ${weightUnit}` });
  }

  const storeName = store?.name || 'Your Store';

  const handleSelectOption = (attributeName: string, option: string) => {
    setSelectedOptions((prev) => ({ ...prev, [attributeName]: option }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Container — full-bleed so the storefront has room to breathe */}
      <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-[95rem] h-[95vh] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
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
              deviceMode === 'mobile' ? 'w-full max-w-[420px] my-auto' : 'w-full max-w-6xl'
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

            {/* Product View Body — storefront chrome (navbar/search/cart) is omitted;
                the preview focuses on the product page itself. */}
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
                <div className={`grid gap-6 lg:gap-10 ${deviceMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
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
                        <span className="font-bold uppercase tracking-wider text-[10.5px]" style={{ color: primaryColor }}>
                          {brandName}
                        </span>
                      )}
                      {displaySku && (
                        <span className="text-slate-400 text-[11px] ml-auto">
                          SKU: <strong className="text-slate-700">{displaySku}</strong>
                        </span>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight">
                      {displayTitle}
                    </h1>

                    <div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${stockToneClasses}`}>
                        {stockState.tone === 'bad' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>{stockState.label}</span>
                      </span>
                    </div>

                    <div
                      className="p-3.5 rounded-2xl border text-slate-900"
                      style={{ backgroundColor: `${primaryColor}0d`, borderColor: `${primaryColor}33` }}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black">৳{displayPrice.toLocaleString()}</span>
                        {hasDiscount && (
                          <span className="text-sm font-semibold text-slate-400 line-through">
                            ৳{comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {taxNote && (
                        <p className="text-[10.5px] font-semibold text-slate-500 mt-1">{taxNote}</p>
                      )}
                    </div>

                    {/* Variant pickers — real attribute/option data from generated variants */}
                    {hasRealVariants ? (
                      <>
                        {attributeOptions.map((attr) => (
                          <div key={attr.attributeName}>
                            <span className="text-xs font-bold text-slate-800 block mb-1.5">{attr.attributeName}:</span>
                            <div className="flex flex-wrap gap-2">
                              {attr.options.map((opt) => {
                                const isSelected = selectedOptions[attr.attributeName] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleSelectOption(attr.attributeName, opt)}
                                    className="px-3 py-1.5 text-xs font-bold rounded-xl border transition-all"
                                    style={
                                      isSelected
                                        ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' }
                                        : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#334155' }
                                    }
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : hasVariants ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          Variant options (Color, Size, …) will show here for customers once you generate the variant
                          matrix in the Variants section.
                        </span>
                      </div>
                    ) : null}

                    {description.trim() && (
                      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
                    )}

                    {/* Quantity & Actions */}
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
                          disabled={!canAddToCart}
                          className="flex-1 h-11 px-4 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: primaryColor, boxShadow: `0 10px 24px -8px ${primaryColor}80` }}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Add {selectedQuantity} to Cart • ৳{(displayPrice * selectedQuantity).toLocaleString()}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!canAddToCart}
                        className="w-full h-11 px-4 font-bold text-xs rounded-2xl border-2 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <Zap className="w-4 h-4" />
                        <span>Buy Now</span>
                      </button>

                      {hasRealVariants && !selectedVariant && (
                        <p className="text-[11px] text-amber-600 font-semibold">Select all options above to add to cart.</p>
                      )}
                      {stockState.tone === 'bad' && (
                        <p className="text-[11px] text-rose-600 font-semibold">This product is currently out of stock.</p>
                      )}
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
