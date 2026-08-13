'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  useGetProductByIdQuery,
  useGetProductReviewsQuery,
  useGetProductAnalyticsSummaryQuery,
  useBulkUpdateProductStatusMutation,
  ProductStatus,
} from '@/features/catalog/api/catalogApi';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { ProductSeoConfig } from '@/features/catalog/components/ProductSeoConfig';
import { ProductRelatedManager } from '@/features/catalog/components/ProductRelatedManager';
import { ProductAnalyticsView } from '@/features/catalog/components/ProductAnalyticsView';
import {
  ArrowLeft,
  Edit,
  Copy,
  ChevronDown,
  ChevronRight,
  Package,
  ExternalLink,
  Image as ImageIcon,
  Star,
  Archive,
  Globe,
  FileEdit,
} from 'lucide-react';
import { toast } from 'sonner';

type TabId =
  | 'overview'
  | 'variants'
  | 'inventory'
  | 'attributes'
  | 'media'
  | 'reviews'
  | 'pricing'
  | 'fulfillment'
  | 'seo'
  | 'related'
  | 'analytics';

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading, isError, refetch } = useGetProductByIdQuery(productId, { skip: !productId });
  const { data: store } = useGetMyStoreQuery();
  const { data: reviewsData } = useGetProductReviewsQuery(productId, { skip: !productId });
  const { data: analytics } = useGetProductAnalyticsSummaryQuery(
    { id: productId, preset: 'LAST_90_DAYS' },
    { skip: !productId },
  );
  const [bulkUpdateStatus] = useBulkUpdateProductStatusMutation();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [activeImage, setActiveImage] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Reset the gallery when navigating between products so a stale index cannot point
  // past the end of a shorter image list.
  useEffect(() => {
    setActiveImage(0);
  }, [productId]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl lg:col-span-2" />
          <div className="h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">Product Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/dashboard/products"
          className="mt-5 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const currencySymbol = store?.currency === 'USD' ? '$' : '৳';
  const productName = product.name || product.title || 'Untitled Product';
  const images = product.images || [];
  const orderedImages = [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const shownImage = orderedImages[activeImage] || orderedImages[0];

  const basePrice = Number(product.basePrice || 0);
  const costPrice = Number(product.costPrice || 0);
  const stock = product.stockInfo;

  const money = (value: number) =>
    `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const handleStatusChange = async (targetStatus: ProductStatus) => {
    try {
      const res = await bulkUpdateStatus({ productIds: [product.id], status: targetStatus }).unwrap();
      if (res.failedCount === 0) {
        toast.success(`Product status updated to ${targetStatus}`);
        refetch();
      } else {
        toast.error(res.failures[0]?.reason || 'Status update failed validation');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update product status');
    }
  };

  const statusBadge = (status?: ProductStatus) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
      DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    const label = status === 'ACTIVE' ? 'Active' : status === 'ARCHIVED' ? 'Archived' : 'Draft';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${map[status || 'DRAFT']}`}>
        {label}
      </span>
    );
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'variants', label: `Variants (${product.variants?.length || 0})` },
    { id: 'inventory', label: 'Inventory' },
    { id: 'attributes', label: 'Attributes' },
    { id: 'media', label: `Media (${images.length})` },
    { id: 'reviews', label: `Reviews (${reviewsData?.totalCount ?? 0})` },
    { id: 'pricing', label: 'Pricing' },
    { id: 'fulfillment', label: 'Fulfillment' },
    { id: 'seo', label: 'SEO' },
    { id: 'related', label: 'Related' },
    { id: 'analytics', label: 'Analytics' },
  ];

  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-start gap-4">
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-slate-900 min-w-0">{value}</span>
    </div>
  );

  const summaryRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-900">{value}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">{productName}</h1>
          <nav aria-label="Breadcrumb" className="mt-1">
            <ol className="flex items-center gap-1 text-xs text-slate-500">
              <li>
                <Link href="/dashboard" className="hover:text-slate-700 font-medium transition-colors">
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li>
                <Link href="/dashboard/products" className="hover:text-slate-700 font-medium transition-colors">
                  Products
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li className="font-semibold text-slate-700 truncate max-w-[220px]" aria-current="page">
                {productName}
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Product</span>
          </Link>

          <Link
            href={`/dashboard/products/create?duplicate=${product.id}`}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isMoreOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMoreOpen(false)} />
                <div
                  role="menu"
                  className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-1"
                >
                  {product.status !== 'ACTIVE' && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setIsMoreOpen(false);
                        handleStatusChange('ACTIVE');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      Publish product
                    </button>
                  )}
                  {product.status === 'ACTIVE' && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setIsMoreOpen(false);
                        handleStatusChange('DRAFT');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                      Move to draft
                    </button>
                  )}
                  {product.status !== 'ARCHIVED' && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setIsMoreOpen(false);
                        handleStatusChange('ARCHIVED');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-600" />
                      Archive product
                    </button>
                  )}
                  {store?.slug && (
                    <a
                      role="menuitem"
                      href={`https://${store.slug}.easycommerce.io/products/${product.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      View on storefront
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gallery + Summary + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="flex flex-col gap-2 shrink-0">
              {orderedImages.length > 0 ? (
                orderedImages.slice(0, 5).map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    aria-label={`Show image ${idx + 1}`}
                    aria-current={idx === activeImage}
                    className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-slate-100 transition-colors ${
                      idx === activeImage ? 'border-blue-600' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img.url} alt={img.altText || productName} className="w-full h-full object-cover" />
                  </button>
                ))
              ) : (
                <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </div>

            {/* Main image */}
            <div className="flex-1 min-w-0 aspect-square max-w-[280px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              {shownImage ? (
                <img
                  src={shownImage.url}
                  alt={shownImage.altText || productName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-[11px] text-slate-400 mt-2">No media uploaded</p>
                </div>
              )}
            </div>

            {/* Key facts */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900">{productName}</h2>
                {statusBadge(product.status)}
              </div>

              <div className="flex items-center gap-4 flex-wrap text-xs">
                <span className="text-slate-500">
                  SKU: <span className="font-semibold text-slate-900">{product.sku || '—'}</span>
                </span>
                <span className="text-slate-500">
                  Barcode: <span className="font-semibold text-slate-900">{product.barcode || '—'}</span>
                </span>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {infoRow('Category', product.category?.name || 'Uncategorized')}
                {infoRow('Brand', product.brand?.name || 'No brand')}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {infoRow('Price', money(basePrice))}
                {infoRow(
                  'Compare at',
                  product.compareAtPrice ? money(Number(product.compareAtPrice)) : '—',
                )}
                {infoRow('Cost', costPrice > 0 ? money(costPrice) : '—')}
                {infoRow(
                  'Rating',
                  reviewsData && reviewsData.totalCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-flex" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${
                              n <= Math.round(reviewsData.avgRating)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200 fill-slate-200'
                            }`}
                          />
                        ))}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {reviewsData.avgRating} ({reviewsData.totalCount} reviews)
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">No reviews yet</span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Status panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">Product Status</h3>

          <div>
            <label htmlFor="product-status" className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Status
            </label>
            <select
              id="product-status"
              value={product.status || 'DRAFT'}
              onChange={(e) => handleStatusChange(e.target.value as ProductStatus)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Visibility</span>
            <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
              {product.isPublished ? 'Online Store' : 'Hidden'}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Published At</span>
              <span className="text-xs font-semibold text-slate-900">{formatDate(product.publishedAt)}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Created At</span>
              <span className="text-xs font-semibold text-slate-900">{formatDate(product.createdAt)}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Updated At</span>
              <span className="text-xs font-semibold text-slate-900">{formatDate(product.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3">Product Description</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description || 'No description provided for this product.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2">Inventory Summary</h3>
              <div>
                {summaryRow('Total Stock', stock?.onHand ?? 0)}
                {summaryRow('Available Stock', stock?.available ?? 0)}
                {summaryRow('Reserved Stock', stock?.reserved ?? 0)}
                {summaryRow('Sold', analytics?.unitsSold?.value ?? 0)}
                {summaryRow('Low Stock Threshold', product.lowStockThreshold ?? 10)}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                View inventory details
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2">Sales Summary</h3>
              <div>
                {summaryRow('Total Sales', money(analytics?.revenue?.value ?? 0))}
                {summaryRow('Total Orders', analytics?.ordersCount?.value ?? 0)}
                {summaryRow('Units Sold', analytics?.unitsSold?.value ?? 0)}
                {summaryRow('Average Order Value', money(analytics?.averageOrderValue?.value ?? 0))}
                {/* Placeholder only. Storefront view tracking does not exist yet, so this
                    rate cannot be derived from real data — it is labelled Demo so nobody
                    mistakes it for a measured figure. Replace once view tracking lands. */}
                {summaryRow(
                  'Conversion Rate',
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-slate-400">2.45%</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase tracking-wide border border-slate-200">
                      Demo
                    </span>
                  </span>,
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Sales figures cover the last 90 days of orders. Conversion rate is placeholder
                data until storefront view tracking is available.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                View analytics
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Product Variants ({product.variants?.length || 0})
            </h3>
            {product.variants && product.variants.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Variant</th>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.variants.map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{v.title}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">{v.sku || '—'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                          {money(Number(v.price ?? basePrice))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">This product does not have variant options.</p>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Inventory &amp; Stock</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'On Hand', value: stock?.onHand ?? 0, tone: 'text-slate-900' },
                { label: 'Reserved', value: stock?.reserved ?? 0, tone: 'text-amber-600' },
                { label: 'Available', value: stock?.available ?? 0, tone: 'text-emerald-600' },
                { label: 'Low Stock Threshold', value: product.lowStockThreshold ?? 10, tone: 'text-slate-900' },
              ].map((c) => (
                <div key={c.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">{c.label}</span>
                  <span className={`text-base font-extrabold ${c.tone}`}>{c.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Stock is summed across every warehouse holding this product.
            </p>
          </div>
        )}

        {activeTab === 'attributes' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Attributes &amp; Specifications</h3>
            {product.attributeValues && product.attributeValues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.attributeValues.map((av) => (
                  <div key={av.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">{av.attribute?.name || 'Attribute'}</span>
                    <span className="text-xs font-bold text-slate-900">{av.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No custom attributes assigned to this product.</p>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Media ({images.length})</h3>
            {orderedImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {orderedImages.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden relative"
                  >
                    <img
                      src={img.url}
                      alt={img.altText || productName}
                      className="w-full h-full object-cover"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-md">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No media uploaded for this product.</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Customer Reviews ({reviewsData?.totalCount ?? 0})
            </h3>
            {reviewsData && reviewsData.reviews.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {reviewsData.reviews.map((r) => (
                  <div key={r.id} className="py-3 first:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex" aria-label={`${r.rating} out of 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3 h-3 ${
                              n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                            }`}
                          />
                        ))}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {r.customerName || r.reviewerName || 'Anonymous'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {r.comment && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                This product has no approved reviews yet.
              </p>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Pricing, Cost &amp; Tax</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-slate-500 block">Base Selling Price</span>
                <span className="text-base font-extrabold text-slate-900">{money(basePrice)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Compare-At Price</span>
                <span className="text-base font-extrabold text-slate-900">
                  {product.compareAtPrice ? money(Number(product.compareAtPrice)) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Cost Price</span>
                <span className="text-base font-extrabold text-slate-900">
                  {costPrice > 0 ? money(costPrice) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Tax Rate</span>
                <span className="text-xs font-bold text-slate-900">
                  {product.taxRate || 0}% ({product.taxCategory || 'STANDARD_VAT'})
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Tax Behavior</span>
                <span className="text-xs font-bold text-slate-900">
                  {product.isTaxInclusive ? 'Tax Inclusive' : 'Tax Exclusive'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fulfillment' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Fulfillment &amp; Delivery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-slate-500 block">Product Type</span>
                <span className="text-xs font-bold text-slate-900">{product.productType || 'PHYSICAL'}</span>
              </div>
              {product.productType === 'PHYSICAL' && (
                <>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Package Weight</span>
                    <span className="text-xs font-bold text-slate-900">
                      {product.weight ? `${product.weight} ${product.weightUnit || 'KG'}` : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Dimensions (L × W × H)</span>
                    <span className="text-xs font-bold text-slate-900">
                      {product.length && product.width && product.height
                        ? `${product.length} × ${product.width} × ${product.height} ${product.dimensionUnit || 'CM'}`
                        : 'Not set'}
                    </span>
                  </div>
                </>
              )}
              {product.productType === 'DIGITAL' && (
                <div>
                  <span className="text-[11px] text-slate-500 block">Delivery Method</span>
                  <span className="text-xs font-bold text-slate-900">
                    {product.digitalDeliveryType || 'Not set'}
                  </span>
                </div>
              )}
              {product.productType === 'SERVICE' && (
                <div>
                  <span className="text-[11px] text-slate-500 block">Service Duration</span>
                  <span className="text-xs font-bold text-slate-900">
                    {product.serviceDuration
                      ? `${product.serviceDuration} ${product.serviceDurationUnit || ''}`
                      : 'Not set'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'seo' && <ProductSeoConfig product={product} storeSlug={store?.slug} />}

        {activeTab === 'related' && (
          <ProductRelatedManager productId={product.id} currencySymbol={currencySymbol} />
        )}

        {activeTab === 'analytics' && (
          <ProductAnalyticsView productId={product.id} currencySymbol={currencySymbol} />
        )}
      </div>
    </div>
  );
}
