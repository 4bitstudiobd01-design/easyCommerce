'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useUpdateProductMutation,
  Product,
  ProductStatus,
  ProductType,
  ProductListParams,
} from '../api/catalogApi';
import { ProductBulkActionBar } from './ProductBulkActionBar';
import { ProductImportModal } from './ProductImportModal';
import Link from 'next/link';
import { Package, Image as ImageIcon, ChevronLeft, ChevronRight, RefreshCw, Eye, Pencil, Trash2 } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ProductListTableProps {
  searchQuery?: string;
  statusFilter?: ProductStatus | 'ALL';
  productTypeFilter?: ProductType | 'ALL';
  sortOption?: string;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onClearFilters?: () => void;
  onAddProductClick?: () => void;
}

export function ProductListTable({
  searchQuery = '',
  statusFilter = 'ALL',
  productTypeFilter = 'ALL',
  sortOption = 'createdAt-DESC',
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
  onAddProductClick,
}: ProductListTableProps) {
  const [sortBy, sortOrder] = sortOption.split('-') as [string, 'ASC' | 'DESC'];

  const queryParams: ProductListParams = {
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    status: statusFilter,
    productType: productTypeFilter,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'DESC',
  };

  const { data, isLoading, isFetching, isError, refetch } = useGetProductsQuery(queryParams);

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteProduct(deleteTarget.id).unwrap();
      toast.success(result.message);
      setSelectedProductIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete product. Please try again.');
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    setTogglingVisibilityId(product.id);
    try {
      await updateProduct({ id: product.id, isVisible: !product.isVisible }).unwrap();
      toast.success(product.isVisible ? 'Hidden from storefront' : 'Now visible on storefront');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update storefront visibility.');
    } finally {
      setTogglingVisibilityId(null);
    }
  };

  const products = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'ALL' || productTypeFilter !== 'ALL');

  const allPageIds = products.map((p) => p.id);
  const isAllPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedProductIds.includes(id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...allPageIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleExportCsv = (specificIds?: string[]) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/catalog';
    const params = new URLSearchParams();

    if (specificIds && specificIds.length > 0) {
      params.set('productIds', specificIds.join(','));
    } else {
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
      if (productTypeFilter && productTypeFilter !== 'ALL') params.set('productType', productTypeFilter);
    }

    const token = localStorage.getItem('bitcommerce_token');
    const storeId = localStorage.getItem('bitcommerce_active_store_id');

    fetch(`${apiUrl}/products/export?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-store-id': storeId || '',
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_export_${Date.now()}.csv`;
        a.click();
      });
  };

  const renderStatusBadge = (status?: ProductStatus, stockInfo?: Product['stockInfo']) => {
    // An ACTIVE product that is out of / low on stock surfaces the stock state here,
    // because that is the fact a merchant needs to act on. Draft and archived keep
    // showing their lifecycle status, which outranks stock for those rows.
    if (status === 'ACTIVE' && stockInfo?.trackInventory) {
      if (stockInfo.stockStatus === 'OUT_OF_STOCK') {
        return (
          <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-[10px] rounded-full border border-rose-200 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Out of Stock
          </span>
        );
      }
      if (stockInfo.stockStatus === 'LOW_STOCK') {
        return (
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Low Stock
          </span>
        );
      }
    }

    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-full border border-slate-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Archived
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full border border-amber-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
    }
  };

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

  if (isError) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-6 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">Unable to Load Products</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          An error occurred while fetching your store products. Please verify your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-6 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">No Matching Products Found</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              No products match your current search parameters or selected filters.
            </p>
          </div>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
            >
              Clear All Filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-6 shadow-sm">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">No Products Yet</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Your catalog is currently empty. Add your first product to start building your store catalog.
        </p>
        {onAddProductClick && (
          <button
            onClick={onAddProductClick}
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all inline-flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        )}
      </div>
    );
  }

  const startRecord = meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const endRecord = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden">
          <div className="h-full bg-blue-600 animate-pulse w-full" />
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        {/* min-w keeps the row on one line instead of squeezing SKU/Stock into three
            wrapped lines; the container scrolls horizontally on narrow screens. */}
        <table className="w-full min-w-[1000px] text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="pl-4 pr-2 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={toggleSelectAllPage}
                  aria-label="Select all products on this page"
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
              </th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3 w-[130px]">SKU</th>
              <th className="px-3 py-3 w-[130px]">Category</th>
              <th className="px-3 py-3 w-[100px]">Price</th>
              <th className="px-3 py-3 w-[80px]">Stock</th>
              <th className="px-3 py-3 w-[110px]">Status</th>
              <th className="px-3 py-3 w-[110px]">Storefront</th>
              <th className="px-3 py-3 w-[110px] text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {products.map((product) => {
              const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;
              const productName = product.name || product.title || 'Untitled Product';
              const isSelected = selectedProductIds.includes(product.id);

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                >
                  <td className="pl-4 pr-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(product.id)}
                      aria-label={`Select ${productName}`}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        title={productName}
                        className="font-semibold text-slate-900 text-xs hover:text-blue-600 transition-colors truncate"
                      >
                        {productName}
                      </Link>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    {product.sku ? (
                      <span className="text-[11px] font-mono text-slate-600 whitespace-nowrap">
                        {product.sku}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <span className="text-[11px] text-slate-600 truncate block">
                      {product.category?.name || '—'}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span className="font-semibold text-slate-900 text-xs whitespace-nowrap">
                      ৳{Number(product.basePrice || 0).toLocaleString()}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    {(() => {
                      const stockInfo = product.stockInfo;
                      if (!stockInfo || !stockInfo.trackInventory) {
                        return <span className="text-[11px] text-slate-400">—</span>;
                      }
                      return (
                        <span className="text-xs font-semibold text-slate-900">
                          {stockInfo.available}
                        </span>
                      );
                    })()}
                  </td>

                  <td className="px-3 py-3">
                    {renderStatusBadge(product.status, product.stockInfo)}
                  </td>

                  <td className="px-3 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!product.isVisible}
                      aria-label={`${product.isVisible ? 'Hide' : 'Show'} ${productName} on storefront`}
                      disabled={togglingVisibilityId === product.id}
                      onClick={() => handleToggleVisibility(product)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        product.isVisible ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          product.isVisible ? 'translate-x-[18px]' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-0.5">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                        title="View product details"
                        aria-label={`View details for ${productName}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        href={`/dashboard/products/create?edit=${product.id}`}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex"
                        title="Edit product"
                        aria-label={`Edit ${productName}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete product"
                        aria-label={`Delete ${productName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Server-Side Pagination Bar */}
      {meta.total > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500">
            Showing {startRecord} to {endRecord} of {meta.total.toLocaleString()} results
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange && onPageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              aria-label="Previous Page"
              className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="text-slate-400 text-xs px-1">...</span>}
                      <button
                        onClick={() => onPageChange && onPageChange(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          p === meta.page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => onPageChange && onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              aria-label="Next Page"
              className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {onPageSizeChange && (
              <select
                value={meta.limit}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                aria-label="Results per page"
                className="ml-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}


      {/* Floating Bulk Action Bar (Chunk 11) */}
      <ProductBulkActionBar
        selectedProductIds={selectedProductIds}
        onClearSelection={() => setSelectedProductIds([])}
        onExportSelected={() => handleExportCsv(selectedProductIds)}
      />

      {/* Product Import Modal (Chunk 11) */}
      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete this product?"
        confirmLabel="Delete Product"
        message={
          <>
            <span className="font-semibold text-slate-700">
              {deleteTarget?.name || deleteTarget?.title}
            </span>{' '}
            will be removed from your catalog. If it already appears in customer orders it is
            archived instead, so order history and reporting stay intact.
          </>
        }
      />
    </div>
  );
}
