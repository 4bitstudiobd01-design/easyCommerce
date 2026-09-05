'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Layers,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  X,
  Upload,
  Download,
  Database,
  Loader2,
} from 'lucide-react';
import {
  useGetCategoryListQuery,
  useGetCategoryKpisQuery,
  useSeedCategoryDemoDataMutation,
  CategoryStatus,
} from '../api/catalogApi';
import { CategoryBrowser } from './CategoryBrowser';
import { CategoryBulkActionBar } from './CategoryBulkActionBar';
import { CategoryImportModal } from './CategoryImportModal';
import { toast } from 'sonner';

interface BreadcrumbEntry {
  id: string | null;
  name: string;
}

export function CategoryManagementApp() {
  // Breadcrumb drill-down state: last entry is the currently viewed level
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([
    { id: null, name: 'Categories' },
  ]);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'sortOrder' | 'name' | 'createdAt' | 'updatedAt' | 'productsCount'>('sortOrder');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Selection UI State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // The parentId to query for the currently viewed breadcrumb level.
  // Root level (top of the drill-down) uses 'root' so only top-level categories show.
  const currentParentId = breadcrumbs[breadcrumbs.length - 1].id ?? 'root';

  const handleExport = async (categoryIdsArray?: string[]) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      params.set('parentId', currentParentId);
      if (categoryIdsArray && categoryIdsArray.length > 0) {
        params.set('categoryIds', categoryIdsArray.join(','));
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/catalog';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}/categories/export?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('Export request failed');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `categories_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Category CSV export downloaded successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export categories');
    }
  };

  // API Queries
  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch: refetchList,
    isError: isListError,
  } = useGetCategoryListQuery({
    page,
    limit,
    search: searchTerm,
    status: statusFilter,
    parentId: currentParentId,
    sortBy,
    sortOrder,
  });

  const {
    data: kpis,
    isLoading: isKpisLoading,
    refetch: refetchKpis,
  } = useGetCategoryKpisQuery();

  const [seedCategoryDemoData, { isLoading: isSeeding }] = useSeedCategoryDemoDataMutation();

  // The demo-data seeder is a development aid only — never exposed in production.
  const isDev = process.env.NODE_ENV !== 'production';

  const categories = listData?.data || [];
  const meta = listData?.meta || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  const isFiltered = searchTerm !== '' || statusFilter !== 'ALL';

  // Reordering (drag handle + up/down arrows) is only reliable when the rows shown are
  // exactly one sibling set in sortOrder — no search/status filter, sorted by sortOrder,
  // and no pagination splitting the siblings across pages.
  const canReorder = !isFiltered && sortBy === 'sortOrder' && sortOrder === 'ASC' && meta.totalPages <= 1;

  // Breadcrumb navigation: drill into a category's subcategories
  const handleNavigate = (categoryId: string, categoryName: string) => {
    setBreadcrumbs((prev) => [...prev, { id: categoryId, name: categoryName }]);
    setPage(1);
    setSelectedIds(new Set());
  };

  // Jump back to a specific breadcrumb level
  const handleNavigateBreadcrumb = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setPage(1);
    setSelectedIds(new Set());
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allOnPage = new Set(categories.map((c) => c.id));
      setSelectedIds(allOnPage);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSortBy('sortOrder');
    setSortOrder('ASC');
    setPage(1);
  };

  const handleRefreshAll = () => {
    refetchList();
    refetchKpis();
  };

  const handleSeedDemoData = async () => {
    try {
      const res = await seedCategoryDemoData().unwrap();
      toast.success(
        res.categoriesCreated > 0
          ? `Seeded ${res.categoriesCreated} demo categories.`
          : res.message,
      );
      handleRefreshAll();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to seed demo categories.');
    }
  };

  // Only worth offering when the store genuinely has nothing set up — and only in dev.
  const showSeedAction =
    isDev && !isListLoading && !isListError && !isFiltered && meta.total === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Categories
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage your product categories and catalog hierarchy.
            </p>
          </div>

          {/* Action CTAs: Visual Import/Export & Primary + Add Category CTA */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isListLoading || isListFetching}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 shadow-sm transition-colors disabled:opacity-50"
              title="Refresh Category List & KPIs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isListFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Import Button */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
              title="Import categories via CSV"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import</span>
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={() => handleExport()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
              title="Export filtered categories to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export</span>
            </button>

            {/* Demo Data Button — development only, shown when the store has no categories */}
            {showSeedAction && (
              <button
                type="button"
                onClick={handleSeedDemoData}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
                title="Seed a demo category tree (development only)"
              >
                {isSeeding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{isSeeding ? 'Seeding…' : 'Load Demo Data'}</span>
              </button>
            )}

            {/* Primary Action Button */}
            <Link
              href="/dashboard/categories/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm shadow-blue-600/20 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Category</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. FOUR KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Categories */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">
              Total Categories
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isKpisLoading ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              kpis?.totalCategories ?? 0
            )}
          </div>
          <p className="text-[11px] font-medium text-slate-400">All time in store</p>
        </div>

        {/* KPI 2: Active Categories */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">
              Active Categories
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isKpisLoading ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              kpis?.activeCategories ?? 0
            )}
          </div>
          <p className="text-[11px] font-medium text-emerald-600 font-semibold">
            {isKpisLoading ? '...' : `${kpis?.activePercentage ?? 0}% active rate`}
          </p>
        </div>

        {/* KPI 3: Parent Categories */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">
              Parent Categories
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isKpisLoading ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              kpis?.parentCategories ?? 0
            )}
          </div>
          <p className="text-[11px] font-medium text-slate-400">Root taxonomy levels</p>
        </div>

        {/* KPI 4: Empty Categories */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">
              Empty Categories
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isKpisLoading ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              kpis?.emptyCategories ?? 0
            )}
          </div>
          <p className="text-[11px] font-medium text-amber-600 font-semibold">
            0 products assigned
          </p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search categories by name or slug..."
              className="w-full pl-9 pr-8 py-2 text-xs text-slate-900 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as CategoryStatus | 'ALL');
                  setPage(1);
                }}
                className="appearance-none text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Field */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="appearance-none text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="sortOrder">Sort by Order</option>
                <option value="name">Sort by Name</option>
                <option value="productsCount">Sort by Products</option>
                <option value="createdAt">Sort by Created</option>
                <option value="updatedAt">Sort by Updated</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Direction Toggle */}
            <button
              type="button"
              onClick={() => {
                setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                setPage(1);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              title={`Switch to ${sortOrder === 'ASC' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortOrder}</span>
            </button>

            {/* Clear Filters Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. BREADCRUMB CATEGORY BROWSER */}
      <CategoryBrowser
        categories={categories}
        isLoading={isListLoading}
        isError={isListError}
        onRetry={handleRefreshAll}
        breadcrumbs={breadcrumbs}
        onNavigate={handleNavigate}
        onNavigateBreadcrumb={handleNavigateBreadcrumb}
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        canReorder={canReorder}
      />

      {/* 5. SERVER-SIDE PAGINATION TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-medium">
        <div>
          {meta.total > 0 ? (
            <span>
              Showing <strong className="text-slate-900 font-bold">{(meta.page - 1) * meta.limit + 1}</strong>–
              <strong className="text-slate-900 font-bold">{Math.min(meta.page * meta.limit, meta.total)}</strong> of{' '}
              <strong className="text-slate-900 font-bold">{meta.total}</strong> categories
            </span>
          ) : (
            <span>Showing 0 of 0 categories</span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Rows:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage || isListFetching}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
              {meta.page} / {meta.totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={!meta.hasNextPage || isListFetching}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar (Chunk 8) */}
      <CategoryBulkActionBar
        selectedCategoryIds={Array.from(selectedIds)}
        onClearSelection={() => setSelectedIds(new Set())}
        onExportSelected={() => handleExport(Array.from(selectedIds))}
        categories={categories}
      />

      {/* Category CSV Import Modal (Chunk 8) */}
      <CategoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
}
