'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGetProductsQuery, ProductStatus, ProductType } from '@/features/catalog/api/catalogApi';
import { ProductListTable } from '@/features/catalog/components/ProductListTable';
import { ProductFilterBar } from '@/features/catalog/components/ProductFilterBar';
import { ProductStatsCards } from '@/features/catalog/components/ProductStatsCards';
import { ProductImportModal } from '@/features/catalog/components/ProductImportModal';
import { ProductReorderPanel } from '@/features/catalog/components/ProductReorderPanel';
import { Modal } from '@/components/ui/Modal';
import { Plus, Upload, Download, ChevronRight, ListOrdered } from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // URL state synchronization
  const searchQuery = searchParams.get('search') || '';
  const statusFilter = (searchParams.get('status') as ProductStatus | 'ALL') || 'ALL';
  const productTypeFilter = (searchParams.get('productType') as ProductType | 'ALL') || 'ALL';
  const categoryFilter = searchParams.get('category') || '';
  const brandFilter = searchParams.get('brand') || '';
  const sortOption = searchParams.get('sort') || 'createdAt-DESC';
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('limit')) || 20;

  // Local state for smooth debounced search input
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Export lives on the page header (matching the agreed layout) but must still honour
  // the active filters, so the current query state is forwarded to the export endpoint.
  const handleExportCsv = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/catalog';
    const params = new URLSearchParams();

    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
    if (productTypeFilter && productTypeFilter !== 'ALL') params.set('productType', productTypeFilter);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    if (brandFilter) params.set('brandId', brandFilter);

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
        window.URL.revokeObjectURL(url);
      });
  };

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const updateQueryParams = (newParams: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    startTransition(() => {
      router.push(`/dashboard/products?${params.toString()}`);
    });
  };

  // Debounce search input update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateQueryParams({ search: localSearch, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleStatusChange = (status: ProductStatus | 'ALL') => {
    updateQueryParams({ status, page: 1 });
  };

  const handleProductTypeChange = (type: ProductType | 'ALL') => {
    updateQueryParams({ productType: type, page: 1 });
  };

  const handleCategoryChange = (categoryId: string) => {
    updateQueryParams({ category: categoryId, page: 1 });
  };

  const handleBrandChange = (brandId: string) => {
    updateQueryParams({ brand: brandId, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    updateQueryParams({ sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateQueryParams({ page });
  };

  const handlePageSizeChange = (size: number) => {
    // Reset to page 1: the current page number may not exist at the new page size.
    updateQueryParams({ limit: size, page: 1 });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    startTransition(() => {
      router.push('/dashboard/products');
    });
  };

  const [sortBy, sortOrder] = sortOption.split('-') as [string, 'ASC' | 'DESC'];

  const { data: productData } = useGetProductsQuery({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    status: statusFilter,
    productType: productTypeFilter,
    categoryId: categoryFilter || undefined,
    brandId: brandFilter || undefined,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'DESC',
  });

  // KPI counts are read from the server rather than from the current page of rows:
  // the list is paginated, so counting the visible rows would report "24 low stock"
  // as whatever happened to land on page 1. limit:1 keeps these cheap — only meta.total
  // is used.
  const { data: outOfStockData } = useGetProductsQuery({ page: 1, limit: 1, stockStatus: 'OUT_OF_STOCK' });
  const { data: lowStockData } = useGetProductsQuery({ page: 1, limit: 1, stockStatus: 'LOW_STOCK' });

  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'ALL' || productTypeFilter !== 'ALL' || categoryFilter || brandFilter);
  const totalCount = productData?.meta?.total ?? 0;
  const statusCounts = productData?.meta?.statusCounts;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products</h1>
          <nav aria-label="Breadcrumb" className="mt-1">
            <ol className="flex items-center gap-1 text-xs text-slate-500">
              <li>
                <Link href="/dashboard" className="hover:text-slate-700 transition-colors font-medium">
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li className="font-semibold text-slate-700" aria-current="page">
                Products
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleExportCsv()}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReorderModalOpen(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Reorder Products</span>
          </button>

          <button
            onClick={() => router.push('/dashboard/products/create')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <ProductStatsCards
        totalProducts={statusCounts?.ALL ?? totalCount}
        activeProducts={statusCounts?.ACTIVE ?? 0}
        outOfStock={outOfStockData?.meta?.total ?? 0}
        lowStock={lowStockData?.meta?.total ?? 0}
        isLoading={!productData}
      />

      {/* Filter Bar */}
      <ProductFilterBar
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        productTypeFilter={productTypeFilter}
        onProductTypeChange={handleProductTypeChange}
        categoryFilter={categoryFilter}
        onCategoryChange={handleCategoryChange}
        brandFilter={brandFilter}
        onBrandChange={handleBrandChange}
        sortOption={sortOption}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Product List Table */}
      <ProductListTable
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        productTypeFilter={productTypeFilter}
        sortOption={sortOption}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onClearFilters={handleClearFilters}
        onAddProductClick={() => router.push('/dashboard/products/create')}
      />

      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <Modal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        title="Reorder Products"
        subtitle="Drag products to control their display order within a homepage section"
        icon={<ListOrdered className="w-5 h-5" />}
        size="xl"
      >
        <ProductReorderPanel onClose={() => setIsReorderModalOpen(false)} />
      </Modal>
    </div>
  );
}
