'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Folder,
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
  MoreVertical,
  ExternalLink,
  Sparkles,
  Package,
} from 'lucide-react';
import {
  useGetCategoryListQuery,
  useGetCategoryTreeQuery,
  useGetCategoryKpisQuery,
  useGetParentCategoriesQuery,
  CategoryStatus,
  CategoryListItem,
} from '../api/catalogApi';
import { CategoryTreeTable } from './CategoryTreeTable';
import { CategoryBulkActionBar } from './CategoryBulkActionBar';
import { CategoryImportModal } from './CategoryImportModal';
import { toast } from 'sonner';

export function CategoryManagementApp() {
  // View Mode: 'tree' (default hierarchy drag & drop) or 'flat' (paginated list)
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | 'ALL'>('ALL');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'sortOrder' | 'name' | 'createdAt' | 'updatedAt' | 'productsCount'>('sortOrder');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Selection UI State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleExport = async (categoryIdsArray?: string[]) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (parentFilter !== 'all') params.set('parentId', parentFilter);
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
    parentId: parentFilter,
    sortBy,
    sortOrder,
  });

  const {
    data: treeData = [],
    isLoading: isTreeLoading,
    isError: isTreeError,
    refetch: refetchTree,
  } = useGetCategoryTreeQuery();

  const {
    data: kpis,
    isLoading: isKpisLoading,
    refetch: refetchKpis,
  } = useGetCategoryKpisQuery();

  const { data: parentOptions = [] } = useGetParentCategoriesQuery();

  const categories = listData?.data || [];
  const meta = listData?.meta || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  const isFiltered = searchTerm !== '' || statusFilter !== 'ALL' || parentFilter !== 'all';

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
    setParentFilter('all');
    setSortBy('sortOrder');
    setSortOrder('ASC');
    setPage(1);
  };

  const handleRefreshAll = () => {
    refetchList();
    refetchTree();
    refetchKpis();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderStatusBadge = (status: CategoryStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            Draft
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. BREADCRUMB & HEADER */}
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Catalog</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Categories</span>
        </nav>

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

            {/* Parent Filter */}
            <div className="relative">
              <select
                value={parentFilter}
                onChange={(e) => {
                  setParentFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer max-w-[180px] truncate"
              >
                <option value="all">All Parents</option>
                <option value="root">Root Categories Only</option>
                {parentOptions.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
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

            {/* View Mode Toggle: Tree Hierarchy vs Flat Table */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'tree'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Interactive Tree Hierarchy with Drag & Drop"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Tree</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'flat'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Paginated Flat Table"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Flat List</span>
              </button>
            </div>

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

      {/* 4. MAIN CATEGORY TABLE / TREE CONTAINER */}
      {viewMode === 'tree' ? (
        <CategoryTreeTable
          tree={treeData}
          isLoading={isTreeLoading}
          isError={isTreeError}
          refetchTree={refetchTree}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={categories.length > 0 && categories.every((c) => selectedIds.has(c.id))}
                    onChange={handleSelectAll}
                    aria-label="Select all categories on page"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isListLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3.5 text-center">
                      <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-36 bg-slate-200 rounded" />
                          <div className="h-2.5 w-24 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-5 w-10 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-16 bg-slate-200 rounded-md" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-3.5 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-7 w-7 bg-slate-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : isListError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-900">Failed to load categories</p>
                    <p className="text-xs text-slate-400">Please check your store connection and try again.</p>
                    <button
                      type="button"
                      onClick={handleRefreshAll}
                      className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      {isFiltered ? <Search className="w-6 h-6" /> : <FolderTree className="w-6 h-6" />}
                    </div>
                    {isFiltered ? (
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">No categories found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          No category records match your active search or filter criteria.
                        </p>
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">No categories yet</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Start organizing your catalog by creating your first product category.
                        </p>
                        <Link
                          href="/dashboard/categories/create"
                          className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Category</span>
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                categories.map((cat: CategoryListItem) => {
                  const isSelected = selectedIds.has(cat.id);
                  const isSubcategory = Boolean(cat.parentId);

                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(cat.id)}
                          aria-label={`Select ${cat.name}`}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Category Name & Hierarchical Presentation */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Indentation for subcategories */}
                          {isSubcategory && (
                            <span className="text-slate-300 font-mono text-sm select-none pl-2 sm:pl-4">
                              └─
                            </span>
                          )}

                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSubcategory
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}
                          >
                            {isSubcategory ? (
                              <Folder className="w-4 h-4" />
                            ) : (
                              <FolderTree className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/categories/${cat.id}`}
                                className="font-bold text-slate-900 text-xs truncate hover:text-blue-600 transition-colors"
                              >
                                {cat.name}
                              </Link>
                              {cat.isFeatured && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono">/{cat.slug}</span>
                              {cat.parentCategory && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500">
                                    Parent: <strong className="text-slate-700">{cat.parentCategory.name}</strong>
                                  </span>
                                </>
                              )}
                              {cat.subcategoriesCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-medium">
                                    {cat.subcategoriesCount} subcategories
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Products Count */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            cat.productsCount > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Package className="w-3 h-3 text-slate-400" />
                          <span>{cat.productsCount}</span>
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {renderStatusBadge(cat.status)}
                      </td>

                      {/* Updated Date */}
                      <td className="px-4 py-3.5 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                        {formatDate(cat.updatedAt || cat.createdAt)}
                      </td>

                      {/* Action Icon */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/dashboard/categories/${cat.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Category Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. SERVER-SIDE PAGINATION TOOLBAR */}
        <div className="px-4 py-3.5 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-medium">
          {/* Item Count Summary */}
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

          {/* Page Controls & Size Selector */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Page Size Selector */}
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

            {/* Prev / Next Buttons */}
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
      </div>
      )}

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
