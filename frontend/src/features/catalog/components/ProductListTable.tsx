'use client';

import React, { useState } from 'react';
import { useGetProductsQuery, Product } from '../api/catalogApi';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { OgShareCardPreviewModal } from '@/features/seo/components/OgShareCardPreviewModal';
import { Package, Tag, Layers, ArrowUpRight, Image as ImageIcon, Share2 } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

interface ProductListTableProps {
  onAddProductClick?: () => void;
}

export function ProductListTable({ onAddProductClick }: ProductListTableProps) {
  const { data: products = [], isLoading, isError } = useGetProductsQuery();
  const { data: store } = useGetMyStoreQuery();
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-3 w-32 bg-slate-200 animate-pulse rounded-lg" />
          </div>
          <div className="h-9 w-32 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <table className="w-full text-left text-xs">
          <tbody>
            <TableRowSkeleton columns={6} />
            <TableRowSkeleton columns={6} />
            <TableRowSkeleton columns={6} />
            <TableRowSkeleton columns={6} />
          </tbody>
        </table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">No Products Found</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Your catalog is currently empty. Add your first product to start accepting orders on your storefront.
        </p>
        {onAddProductClick && (
          <button
            onClick={onAddProductClick}
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all inline-flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>Add First Product</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900">Store Catalog Products</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {products.length} products listed in your tenant catalog
          </p>
        </div>

        {onAddProductClick && (
          <button
            onClick={onAddProductClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Product</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Price (৳)</th>
              <th className="px-6 py-3.5">SKU / Variant</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Created</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {products.map((product) => {
              const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

              return (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {product.title}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          /{product.slug}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {product.category?.name ? (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 inline-flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{product.category.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Uncategorized</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        ৳{Number(product.basePrice).toLocaleString()}
                      </span>
                      {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.basePrice) ? (
                        <span className="text-[11px] text-slate-400 line-through ml-2">
                          ৳{Number(product.compareAtPrice).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                      {product.images?.[0]?.url ? '1 SKU' : 'Default SKU'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {product.isPublished ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                        Published
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full border border-amber-200">
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right text-slate-400 text-[11px]">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(product)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview social share card"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {previewProduct && (
        <OgShareCardPreviewModal
          isOpen={Boolean(previewProduct)}
          onClose={() => setPreviewProduct(null)}
          title={previewProduct.title}
          description={previewProduct.description || `Buy ${previewProduct.title} online.`}
          image={previewProduct.images?.find((img) => img.isPrimary)?.url || previewProduct.images?.[0]?.url || ''}
          url={store?.slug && typeof window !== 'undefined' ? `${window.location.origin}/store/${store.slug}` : ''}
          price={Number(previewProduct.basePrice)}
          currency={store?.currency}
          storeName={store?.name}
        />
      )}
    </div>
  );
}
