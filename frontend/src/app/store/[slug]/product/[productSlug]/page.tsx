'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
  ShoppingBag,
  Heart,
  Minus,
  Plus,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Ruler,
  Share2,
  MessageCircleQuestion,
  Star,
  AlertCircle,
  Sparkles,
  Scale,
  Palette,
  Shirt,
  Package,
  Tag as TagIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Picks a sensible icon for a spec/feature tile from its attribute name. */
function featureIconFor(label: string): LucideIcon {
  const key = label.toLowerCase();
  if (/weight|mass|gram|kg/.test(key)) return Scale;
  if (/colou?r|shade/.test(key)) return Palette;
  if (/fabric|material|cotton|leather|fit/.test(key)) return Shirt;
  if (/size|dimension|length|width|height/.test(key)) return Ruler;
  if (/warranty|guarantee|secure|authentic/.test(key)) return ShieldCheck;
  if (/deliver|ship|return/.test(key)) return Truck;
  if (/brand|model|type/.test(key)) return TagIcon;
  return Package;
}
import {
  useGetPublicStoreProductBySlugQuery,
  useGetPublicStoreProductsQuery,
} from '@/features/storefront/api/storefrontApi';
import { useGetApprovedReviewsQuery } from '@/features/catalog/api/catalogApi';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { ProductGallery } from '@/features/storefront/components/product/ProductGallery';
import { ProductInfoTabs } from '@/features/storefront/components/product/ProductInfoTabs';
import { RelatedProductsCarousel } from '@/features/storefront/components/product/RelatedProductsCarousel';
import { addToCart } from '@/features/storefront/slices/cartSlice';
import {
  resolveVariant,
  getVariantAttributeOptions,
} from '@/features/storefront/utils/resolveProductVariant';
import { resolveSwatchColor, isColorAttribute } from '@/features/storefront/utils/colorSwatch';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Trims a verbose option label to its short form for the swatch button:
 * "XL (Extra Large)" -> "XL", "US 9" stays "US 9". Keeps the full text as the
 * button's title/tooltip.
 */
function shortOptionLabel(label: string): string {
  const beforeParen = label.split('(')[0].trim();
  return beforeParen || label;
}

export default function ProductLandingPage() {
  const params = useParams();
  const dispatch = useDispatch();
  const slug = (params.slug as string) || '';
  const productSlug = (params.productSlug as string) || '';

  const { data, isLoading, isError } = useGetPublicStoreProductBySlugQuery(
    { storeSlug: slug, productSlug },
    { skip: !slug || !productSlug },
  );

  const store = data?.store;
  const product = data?.product;
  const primaryColor = store?.primaryColor || '#2563eb';

  const { data: reviewData } = useGetApprovedReviewsQuery(product?.id ?? '', {
    skip: !product?.id,
  });
  const avgRating = reviewData?.avgRating ?? 0;
  const reviewCount = reviewData?.totalCount ?? 0;

  // All store products — used to build the "You might also like" rail.
  const { data: storeProducts } = useGetPublicStoreProductsQuery({ slug }, { skip: !slug });

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const attributeOptions = useMemo(
    () => getVariantAttributeOptions(product?.variants),
    [product?.variants],
  );
  const selectedVariant = useMemo(
    () => resolveVariant(product?.variants, selectedOptions),
    [product?.variants, selectedOptions],
  );

  const images = useMemo(() => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if ((product as any)?.image) return [(product as any).image];
    if ((product as any)?.imageUrl) return [(product as any).imageUrl];
    return [];
  }, [product]);

  const basePrice = Number(product?.basePrice || 0);
  const displayPrice = selectedVariant?.price != null ? Number(selectedVariant.price) : basePrice;
  const compareAtPrice =
    selectedVariant?.compareAtPrice != null
      ? Number(selectedVariant.compareAtPrice)
      : product?.compareAtPrice != null
        ? Number(product.compareAtPrice)
        : 0;
  const hasDiscount = compareAtPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100)
    : 0;

  const hasVariants = attributeOptions.length > 0;
  const variantSelectionComplete = !hasVariants || Boolean(selectedVariant);

  // Map an option label (per attribute) -> the variant image index it should show.
  const optionImageIndex = useMemo(() => {
    const map = new Map<string, number>();
    if (!product?.variants || images.length === 0) return map;
    for (const variant of product.variants) {
      if (!variant.imageId || !Array.isArray(variant.options)) continue;
      const imgIdx = images.findIndex((im) =>
        im && typeof im === 'object' && im.id ? im.id === variant.imageId : false
      );
      if (imgIdx < 0) continue;
      for (const opt of variant.options) {
        const key = `${opt.attributeName}::${opt.optionLabel}`;
        if (!map.has(key)) map.set(key, imgIdx);
      }
    }
    return map;
  }, [product?.variants, images]);

  const handleSelectOption = (attributeName: string, optionLabel: string) => {
    setSelectedOptions((prev) => {
      const next = { ...prev, [attributeName]: optionLabel };
      return next;
    });
    const jumpTo = optionImageIndex.get(`${attributeName}::${optionLabel}`);
    if (jumpTo != null) setActiveImageIndex(jumpTo);
  };

  const handleClearAttribute = (attributeName: string) => {
    setSelectedOptions((prev) => {
      const next = { ...prev };
      delete next[attributeName];
      return next;
    });
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
              options: selectedVariant.options?.map((o) => ({
                attributeName: o.attributeName,
                optionLabel: o.optionLabel,
              })),
            }
          : undefined,
      }),
    );
    toast.success(`${quantity} × ${product.title || product.name} added to cart.`);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.title || product?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Product link copied to clipboard.');
      }
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  };

  const scrollToReviews = () => {
    document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const relatedProducts = useMemo(() => {
    if (!product || !storeProducts?.products) return [];
    return storeProducts.products
      .filter((p) => p.id !== product.id)
      .sort((a, b) => {
        const aMatch = a.category?.id && a.category.id === product.category?.id ? 0 : 1;
        const bMatch = b.category?.id && b.category.id === product.category?.id ? 0 : 1;
        return aMatch - bMatch;
      })
      .slice(0, 10);
  }, [product, storeProducts]);

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

  const title = product.title || product.name || 'Product';
  const isNewArrival = (product.homepageSections || []).includes('NEW_ARRIVALS');
  const specBullets = (product.attributeValues || []).slice(0, 4);
  const tags: string[] = Array.isArray((product as any).tags) ? (product as any).tags : [];

  const specFeatureTiles = specBullets.map((av: any) => ({
    label: av.attribute?.name || av.attributeName,
    value: av.value,
  }));
  const trustFeatureTiles = [
    { label: 'Fast Delivery', value: 'Ships within 1–2 days', Icon: Truck },
    { label: '100% Authentic', value: 'Genuine products only', Icon: ShieldCheck },
    { label: '7-Day Return', value: 'Easy hassle-free returns', Icon: RotateCcw },
    { label: 'Secure Payment', value: 'Protected checkout', Icon: Check },
  ];
  const featureTiles =
    specFeatureTiles.length > 0
      ? specFeatureTiles.map((t) => ({ ...t, Icon: featureIconFor(t.label) }))
      : trustFeatureTiles;

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans"
      style={{ ['--brand' as any]: primaryColor }}
    >
      <CartDrawer primaryColor={primaryColor} />
      <ShopEaseNavbar
        storeName={store.name || 'Storefront'}
        slug={slug}
        category={store.category}
        primaryColor={primaryColor}
        logo={store.logo}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-10">
        {/* Breadcrumb */}
        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 flex-wrap">
          <Link href={`/store/${slug}`} className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          {product.category?.name && (
            <>
              <Link
                href={`/store/${slug}/shop`}
                className="hover:text-slate-900 transition-colors"
              >
                {product.category.name}
              </Link>
              <span className="text-slate-300">/</span>
            </>
          )}
          <span className="text-slate-900 truncate max-w-[220px]">{title}</span>
        </div>

        {/* HERO: gallery + buy box */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-start">
          {/* Gallery */}
          <ProductGallery
            images={images}
            activeIndex={activeImageIndex}
            onActiveIndexChange={setActiveImageIndex}
            primaryColor={primaryColor}
            discountPercent={discountPercent}
            badgeLabel={isNewArrival ? 'New Arrival' : undefined}
            alt={title}
          />

          {/* Details */}
          <div className="space-y-5">
            {product.brand?.name && (
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: primaryColor }}
              >
                {product.brand.name}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
              {title}
            </h1>

            {product.description && (
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Rating row */}
            <button
              type="button"
              onClick={scrollToReviews}
              className="flex items-center gap-2 text-sm"
            >
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${
                      n <= Math.round(avgRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </span>
              {reviewCount > 0 ? (
                <>
                  <span className="font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                  <span className="text-slate-400 font-semibold hover:underline">
                    {reviewCount} Review{reviewCount === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span className="text-slate-400 font-semibold hover:underline">No reviews yet</span>
              )}
            </button>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-black text-slate-900">
                ৳{displayPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg font-semibold text-slate-400 line-through">
                    ৳{compareAtPrice.toLocaleString()}
                  </span>
                  <span
                    className="text-xs font-black rounded-lg px-2 py-1"
                    style={{ color: primaryColor, backgroundColor: `${primaryColor}14` }}
                  >
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Stock / social proof — semantic colours for stock, brand accent for the arrival pill */}
            <div className="flex items-center gap-4 text-xs font-bold">
              {product.inStock === false ? (
                <span className="inline-flex items-center gap-1 text-rose-600">Out of Stock</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <Check className="w-3.5 h-3.5" />
                  In Stock
                </span>
              )}
              {isNewArrival && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
                  style={{ color: primaryColor, backgroundColor: `${primaryColor}12` }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  New Arrival
                </span>
              )}
            </div>

            {/* Variant pickers */}
            {attributeOptions.map((attr) => {
              const isColor = isColorAttribute(attr.attributeName);
              const selected = selectedOptions[attr.attributeName];
              return (
                <div key={attr.attributeName} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-800">{attr.attributeName}:</span>
                    {selected && (
                      <span className="text-slate-500 font-semibold">{shortOptionLabel(selected)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {attr.options.map((opt) => {
                      const isSelected = selected === opt;
                      const label = shortOptionLabel(opt);
                      const swatchImgIdx = optionImageIndex.get(
                        `${attr.attributeName}::${opt}`,
                      );
                      const swatchImg =
                        swatchImgIdx != null
                          ? typeof images[swatchImgIdx] === 'string'
                            ? (images[swatchImgIdx] as unknown as string)
                            : images[swatchImgIdx]?.url
                          : undefined;
                      const swatchColor = resolveSwatchColor(opt);

                      if (isColor && (swatchImg || swatchColor)) {
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectOption(attr.attributeName, opt)}
                            title={opt}
                            aria-label={opt}
                            className="w-11 h-11 rounded-xl border-2 overflow-hidden flex items-center justify-center transition-all"
                            style={
                              isSelected
                                ? {
                                    borderColor: primaryColor,
                                    boxShadow: `0 0 0 3px ${primaryColor}22`,
                                  }
                                : { borderColor: '#e2e8f0' }
                            }
                          >
                            {swatchImg ? (
                              <img src={swatchImg} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span
                                className="w-6 h-6 rounded-full border border-black/5"
                                style={{ backgroundColor: swatchColor as string }}
                              />
                            )}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          title={opt}
                          onClick={() => handleSelectOption(attr.attributeName, opt)}
                          className="min-w-[44px] h-11 px-3 text-xs font-bold rounded-xl border-2 transition-all"
                          style={
                            isSelected
                              ? {
                                  borderColor: primaryColor,
                                  color: primaryColor,
                                  backgroundColor: `${primaryColor}0d`,
                                }
                              : { borderColor: '#e2e8f0', color: '#334155', backgroundColor: '#fff' }
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {selected && (
                    <button
                      type="button"
                      onClick={() => handleClearAttribute(attr.attributeName)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              );
            })}

            {/* Size guide + stock line */}
            <div className="flex items-center gap-5 text-[11px] font-bold text-slate-500 pt-1">
              <span
                className="inline-flex items-center gap-1.5 cursor-pointer transition-colors hover:[color:var(--brand)]"
              >
                <Ruler className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                SIZE GUIDE
              </span>
              {product.inStock !== false && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  IN STOCK
                </span>
              )}
            </div>

            {/* Quantity + Add to cart */}
            <div className="space-y-3 pt-1">
              <div className="flex items-stretch gap-3">
                <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50/70 px-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-sm font-extrabold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!variantSelectionComplete || product.inStock === false}
                  className="flex-1 h-11 px-4 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 12px 28px -10px ${primaryColor}80` }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
              {hasVariants && !selectedVariant && (
                <p className="text-[11px] text-amber-600 font-semibold">
                  Select all options above to add to cart.
                </p>
              )}
            </div>

            {/* Secondary actions */}
            <div className="flex items-center gap-5 text-xs font-bold text-slate-600 pt-1">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 transition-colors hover:[color:var(--brand)]"
              >
                <Heart className="w-3.5 h-3.5" />
                Wishlist
              </button>
              <button
                type="button"
                onClick={scrollToReviews}
                className="inline-flex items-center gap-1.5 transition-colors hover:[color:var(--brand)]"
              >
                <MessageCircleQuestion className="w-3.5 h-3.5" />
                Ask question
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 transition-colors hover:[color:var(--brand)]"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>

            {/* Meta table — only rows that actually have data */}
            {(selectedVariant?.sku || product.sku || product.category?.name || tags.length > 0) && (
              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                {(selectedVariant?.sku || product.sku) && (
                  <div className="flex gap-3">
                    <span className="w-20 font-bold text-slate-400 uppercase tracking-wide">SKU</span>
                    <span className="text-slate-700 font-semibold">
                      {selectedVariant?.sku || product.sku}
                    </span>
                  </div>
                )}
                {product.category?.name && (
                  <div className="flex gap-3">
                    <span className="w-20 font-bold text-slate-400 uppercase tracking-wide">
                      Category
                    </span>
                    <span className="text-slate-700 font-semibold">{product.category.name}</span>
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="flex gap-3">
                    <span className="w-20 font-bold text-slate-400 uppercase tracking-wide">Tags</span>
                    <span className="text-slate-700 font-semibold">{tags.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {featureTiles.map((tile, i) => {
            const Icon = tile.Icon || Check;
            return (
              <div
                key={i}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1.5"
              >
                <Icon className="w-4 h-4" style={{ color: primaryColor }} />
                <p className="text-xs font-extrabold text-slate-900">{tile.label}</p>
                <p className="text-[11px] text-slate-500 leading-snug">{tile.value}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div id="product-tabs" className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8">
          <ProductInfoTabs product={product} reviewCount={reviewCount} primaryColor={primaryColor} />
        </div>

        {/* You might also like */}
        <RelatedProductsCarousel
          products={relatedProducts}
          storeSlug={slug}
          primaryColor={primaryColor}
        />
      </main>
    </div>
  );
}
