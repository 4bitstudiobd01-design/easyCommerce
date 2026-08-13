'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { ProductStatus, ProductType, useGetCategoriesQuery, useGetBrandsQuery } from '../api/catalogApi';

interface ProductFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ProductStatus | 'ALL';
  onStatusChange: (status: ProductStatus | 'ALL') => void;
  productTypeFilter: ProductType | 'ALL';
  onProductTypeChange: (type: ProductType | 'ALL') => void;
  categoryFilter?: string;
  onCategoryChange?: (categoryId: string) => void;
  brandFilter?: string;
  onBrandChange?: (brandId: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function ProductFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  productTypeFilter,
  onProductTypeChange,
  categoryFilter = '',
  onCategoryChange,
  brandFilter = '',
  onBrandChange,
  sortOption,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
}: ProductFilterBarProps) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products by name or slug..."
          aria-label="Search products by name or slug"
          className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as any)}
            aria-label="Filter products by status"
            className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Product Type Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <select
            value={productTypeFilter}
            onChange={(e) => onProductTypeChange(e.target.value as any)}
            aria-label="Filter products by type"
            className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
          >
            <option value="ALL">All Types</option>
            <option value="PHYSICAL">Physical</option>
            <option value="DIGITAL">Digital</option>
            <option value="SERVICE">Service</option>
          </select>
        </div>

        {/* Category Filter */}
        {onCategoryChange && categories.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter products by category"
              className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Brand Filter */}
        {onBrandChange && brands.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            <select
              value={brandFilter}
              onChange={(e) => onBrandChange(e.target.value)}
              aria-label="Filter products by brand"
              className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort products list"
            className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-xs"
          >
            <option value="createdAt-DESC">Newest First</option>
            <option value="createdAt-ASC">Oldest First</option>
            <option value="name-ASC">Name (A-Z)</option>
            <option value="name-DESC">Name (Z-A)</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            aria-label="Clear active filters"
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
