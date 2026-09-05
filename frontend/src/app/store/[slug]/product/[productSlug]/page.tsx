'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
  ShoppingBag,
  Minus,
  Plus,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  ImageOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useGetPublicStoreProductBySlugQuery } from '@/features/storefront/api/storefrontApi';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { ProductReviewsSection } from '@/features/storefront/components/ProductReviewsSection';
import { addToCart } from '@/features/storefront/slices/cartSlice';
import { resolveVariant, getVariantAttributeOptions } from '@/features/storefront/utils/resolveProductVariant';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductLandingPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const slug = (params.slug as string) || '';
  const productSlug = (params.productSlug as string) || '';

  const { data, isLoading, isError } = useGetPublicStoreProductBySlugQuery(
    { storeSlug: slug, productSlug },
    { skip: !slug || !productSlug },
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const store = data?.store;
  const product = data?.product;
  const primaryColor = store?.primaryColor || '#2563eb';

  const attributeOptions = useMemo(() => getVariantAttributeOptions(product?.variants), [product?.variants]);
  const selectedVariant = useMemo(
    () => resolveVariant(product?.variants, selectedOptions),
    [product?.variants, selectedOptions],
  );

  const images = product?.images && product.images.length > 0 ? product.images : [];
  const activeImageUrl = images[selectedImageIndex]?.url || images[0]?.url;

  const basePrice = Number(product?.basePrice || 0);
  const displayPrice = selectedVariant?.price != null ? Number(selectedVariant.price) : basePrice;
  const compareAtPrice = selectedVariant?.compareAtPrice != null
    ? Number(selectedVariant.compareAtPrice)
    : product?.compareAtPrice != null
      ? Number(product.compareAtPrice)
      : 0;
  const hasDiscount = compareAtPrice > displayPrice;
  const discountPercent = hasDiscount ? Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100) : 0;

  const hasVariants = attributeOptions.length > 0;
  const variantSelectionComplete = !hasVariants || Boolean(selectedVariant);

  const handleSelectOption = (attributeName: string, optionLabel: string) => {
    setSelectedOptions((prev) => ({ ...prev, [attributeName]: optionLabel }));
    setSelectedImageIndex(0);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (hasVariants && !selectedVariant) {
      toast.error('Please select all product options first.');
      return;
    }

    dispatch(
      addToCart({
        product,
        quantity,
        storeSlug: slug,
        variant: selectedVariant
          ? {
              id: selectedVariant.id,
              title: selectedVariant.title,
              price: selectedVariant.price,
              sku: selectedVariant.sku,
              options: selectedVariant.options?.map((o) => ({ attributeName: o.attributeName, optionLabel: o.optionLabel })),
            }
          : undefined,
      }),
    );
    toast.success(`${quantity} × ${product.title || product.name} added to cart.`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="h-20 bg-white border-b border-slate-200" />
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full rounded-[28px]" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !product || !store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-xl max-w-md text-center space-y-3">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Product Not Found</h2>
          <p className="text-xs text-slate-500">
            This product may have been removed or is no longer available.
          </p>
          <Link
            href={`/store/${slug}/shop`}
            className="inline-flex items-center gap-2 mt-2 h-10 px-5 text-white text-xs font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
            style={{ backgroundColor: primaryColor }}
          >
            Browse the Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <CartDrawer primaryColor={primaryColor} />
      <ShopEaseNavbar
        storeName={store.name || 'Storefront'}
        slug={slug}
        category={store.category}
        primaryColor={primaryColor}
        logo={store.logo}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Breadcrumb */}
        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 flex-wrap">
          <Link href={`/store/${slug}`} className="hover:text-slate-900 transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          {product.category?.name && (
            <>
              <span>{product.category.name}</span>
              <span className="text-slate-300">/</span>
            </>
          )}
          <span className="text-slate-900 truncate max-w-[220px]">{product.title || product.name}</span>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-5 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
                {activeImageUrl ? (
                  <img
                    src={activeImageUrl}
                    alt={product.title || product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                    <ImageOff className="w-10 h-10" />
                    <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
                  </div>
                )}
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
                      key={img.id || idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === idx ? '' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      style={
                        selectedImageIndex === idx
                          ? { borderColor: primaryColor, boxShadow: `0 0 0 2px ${primaryColor}33` }
                          : undefined
                      }
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                {product.brand?.name && (
                  <span className="font-bold uppercase tracking-wider text-[10.5px]" style={{ color: primaryColor }}>
                    {product.brand.name}
                  </span>
                )}
                {product.sku && (
                  <span className="text-slate-400 text-[11px] ml-auto">
                    SKU: <strong className="text-slate-700">{selectedVariant?.sku || product.sku}</strong>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight">
                {product.title || product.name}
              </h1>

              <div>
                {product.inStock ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px]">
                    <Check className="w-3 h-3" />
                    <span>In Stock</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-full font-bold text-[11px]">
                    <span>Out of Stock</span>
                  </span>
                )}
              </div>

              <div
                className="p-3.5 rounded-2xl border text-slate-900 flex items-baseline gap-3"
                style={{ backgroundColor: `${primaryColor}0d`, borderColor: `${primaryColor}33` }}
              >
                <span className="text-2xl font-black">৳{displayPrice.toLocaleString()}</span>
                {hasDiscount && (
                  <span className="text-sm font-semibold text-slate-400 line-through">
                    ৳{compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Variant pickers */}
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

              {product.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
              )}

              {/* Quantity + Add to Cart */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-extrabold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!variantSelectionComplete || product.inStock === false}
                    className="flex-1 h-11 px-4 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 24px -8px ${primaryColor}80` }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add {quantity} to Cart • ৳{(displayPrice * quantity).toLocaleString()}</span>
                  </button>
                </div>
                {hasVariants && !selectedVariant && (
                  <p className="text-[11px] text-amber-600 font-semibold">Select all options above to add to cart.</p>
                )}
              </div>

              {/* Trust highlights */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <Truck className="w-4 h-4 mx-auto mb-1" style={{ color: primaryColor }} />
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
          {product.attributeValues && product.attributeValues.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">Specifications</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-100">
                    {product.attributeValues.map((av: any, i: number) => (
                      <tr key={i} className="even:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-700 w-1/3 bg-slate-50/80">
                          {av.attribute?.name || av.attributeName}
                        </td>
                        <td className="p-2.5 text-slate-900 font-medium">{av.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reviews */}
          <ProductReviewsSection productId={product.id} />
        </div>
      </main>
    </div>
  );
}
