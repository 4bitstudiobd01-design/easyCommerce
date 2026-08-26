'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  Layers,
  SlidersHorizontal,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  ExternalLink,
  Edit,
  ArrowUpDown,
  Boxes,
} from 'lucide-react';
import {
  useGetProductVariantInventoryQuery,
  ProductVariantInventoryItem,
  ListProductVariantInventoryParams,
} from '../api/inventoryApi';

interface ProductVariantInventoryViewProps {
  productId: string;
  product?: any;
  onTabChange?: (tab: string) => void;
}

export function ProductVariantInventoryView({
  productId,
  product: initialProduct,
  onTabChange,
}: ProductVariantInventoryViewProps) {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'sku' | 'available' | 'onHand' | 'updatedAt'>('title');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput !== debouncedSearch) {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const queryParams: ListProductVariantInventoryParams = useMemo(() => {
    const p: ListProductVariantInventoryParams = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [page, limit, debouncedSearch, statusFilter, sortBy, sortOrder]);

  const {
    data: variantData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetProductVariantInventoryQuery(
    { productId, params: queryParams },
    { skip: !productId },
  );

  const product = variantData?.product || initialProduct;
  const summary = variantData?.summary || {
    totalVariants: 0,
    totalOnHand: 0,
    totalReserved: 0,
    totalAvailable: 0,
    lowStockVariants: 0,
    outOfStockVariants: 0,
    inStockVariants: 0,
  };
  const items = variantData?.data || [];
  const meta = variantData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const handleSortChange = (field: 'title' | 'sku' | 'available' | 'onHand' | 'updatedAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const getStatusBadge = (status: ProductVariantInventoryItem['status'], isInitialized: boolean) => {
    if (!isInitialized) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          Not Initialized
        </span>
      );
    }

    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
            In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-600 mr-1 shrink-0" />
            Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600 mr-1 shrink-0" />
            Out of Stock
          </span>
        );
      case 'NOT_TRACKED':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Not Tracked
          </span>
        );
    }
  };

  const hasActiveFilters = Boolean(debouncedSearch || statusFilter);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <span>&gt;</span>
            <Link href="/dashboard/products" className="hover:text-slate-600 transition-colors">
              Products
            </Link>
            <span>&gt;</span>
            <span className="text-slate-700 font-semibold truncate max-w-[200px]">
              {product?.name || 'Loading...'}
            </span>
          </nav>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Details</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/products/${productId}/edit`}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            Edit Product
          </Link>
        </div>
      </div>

      {/* Product-Level Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200/80 px-2 overflow-x-auto">
        <button className="pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap">
          Overview
        </button>
        <button className="pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap">
          Variants ({summary.totalVariants})
        </button>
        <button className="pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600 transition-colors whitespace-nowrap">
          Inventory
        </button>
        <button className="pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap">
          Attributes
        </button>
        <button className="pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap">
          Media
        </button>
        <button className="pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap">
          Reviews
        </button>
      </div>

      {/* Context Top Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
            {product?.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt={product?.name || 'Product'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <Package className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-snug">
              {product?.name || 'Product Variants'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>SKU: <strong className="font-mono text-slate-700">{product?.sku || 'No SKU'}</strong></span>
              {product?.categoryName && (
                <>
                  <span>•</span>
                  <span>Category: <strong className="text-slate-700">{product.categoryName}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/products/${productId}/edit`}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Variant Stock</span>
          </Link>

          <Link
            href={`/dashboard/inventory/adjust?productId=${productId}`}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust Stock</span>
          </Link>
        </div>
      </div>

      {/* Aggregate Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Variants
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {summary.totalVariants}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            On Hand
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {summary.totalOnHand}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 text-center">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
            Reserved
          </span>
          <span className="text-xl font-extrabold text-amber-600 mt-1 block">
            {summary.totalReserved}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 bg-blue-50/40 shadow-sm p-4 text-center">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
            Available
          </span>
          <span className="text-xl font-extrabold text-blue-700 mt-1 block">
            {summary.totalAvailable}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 bg-amber-50/40 shadow-sm p-4 text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            Low Stock
          </span>
          <span className="text-xl font-extrabold text-amber-700 mt-1 block">
            {summary.lowStockVariants}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 bg-rose-50/40 shadow-sm p-4 text-center">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Out of Stock
          </span>
          <span className="text-xl font-extrabold text-rose-700 mt-1 block">
            {summary.outOfStockVariants}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search variants by title, SKU..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="NOT_TRACKED">Not Tracked</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Variant Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSortChange('title')}
                    className="inline-flex items-center gap-1 hover:text-slate-800 focus:outline-none"
                  >
                    <span>Variant</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSortChange('sku')}
                    className="inline-flex items-center gap-1 hover:text-slate-800 focus:outline-none"
                  >
                    <span>SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleSortChange('onHand')}
                    className="inline-flex items-center gap-1 hover:text-slate-800 focus:outline-none ml-auto"
                  >
                    <span>Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Reserved</th>
                <th className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleSortChange('available')}
                    className="inline-flex items-center gap-1 hover:text-slate-800 focus:outline-none ml-auto"
                  >
                    <span>Available</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Threshold</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-12 bg-slate-200 rounded ml-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-10 bg-slate-200 rounded ml-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-12 bg-slate-200 rounded ml-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-10 bg-slate-200 rounded ml-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 w-20 bg-slate-200 rounded-full mx-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 w-20 bg-slate-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {hasActiveFilters ? 'No Matching Variants' : 'This product has no variants.'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters
                          ? 'Try clearing your search or status filter to see other variants.'
                          : 'You can create variant options (e.g. Size, Color) in the product configuration.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <Link
                          href={`/dashboard/products/${productId}/edit`}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm shadow-blue-600/30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Variant</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.variantId} className="hover:bg-slate-50/70 transition-colors">
                    {/* Variant Title */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{item.variantTitle}</span>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {item.sku ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                          {item.sku}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* On Hand */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {item.quantityOnHand.toLocaleString()}
                    </td>

                    {/* Reserved */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-500">
                      {item.quantityReserved > 0 ? (
                        <span className="text-amber-600">{item.quantityReserved.toLocaleString()}</span>
                      ) : (
                        '0'
                      )}
                    </td>

                    {/* Available */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-blue-600">
                      {item.availableQuantity.toLocaleString()}
                    </td>

                    {/* Threshold */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                      {item.lowStockThreshold.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(item.status, item.isInitialized)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.inventoryStockId && (
                          <Link
                            href={`/dashboard/inventory/${item.inventoryStockId}`}
                            className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all"
                            title="View Inventory Details"
                          >
                            <span>Details</span>
                          </Link>
                        )}

                        <Link
                          href={
                            item.inventoryStockId
                              ? `/dashboard/inventory/adjust?inventoryId=${item.inventoryStockId}&variantId=${item.variantId}&productId=${productId}`
                              : `/dashboard/inventory/adjust?productId=${productId}&variantId=${item.variantId}`
                          }
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all"
                          title="Adjust Stock"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Adjust</span>
                        </Link>

                        {item.inventoryStockId && (
                          <Link
                            href={`/dashboard/inventory/${item.inventoryStockId}/history`}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
                            title="View Movement History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Showing {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} variants
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="px-3 py-1.5 text-slate-600 font-bold">
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
