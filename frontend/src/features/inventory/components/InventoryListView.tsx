'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  SlidersHorizontal,
  ArrowRight,
  AlertTriangle,
  XCircle,
  Boxes,
  History,
  Settings,
  CheckCircle2,
  Download,
  MoreVertical,
} from 'lucide-react';


import {
  useGetInventoryListQuery,
  useGetInventoryKpisQuery,
  ListInventoryParams,
  InventoryListItem,
} from '../api/inventoryApi';

import { InventoryKpiCards } from './InventoryKpiCards';
import { InventoryOverviewSection } from './InventoryOverviewSection';
import { InventoryFilterBar } from './InventoryFilterBar';
import { InventoryTable } from './InventoryTable';
import { InventoryPagination } from './InventoryPagination';
import { BulkAdjustStockModal } from './BulkAdjustStockModal';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';



export function InventoryListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: store } = useGetMyStoreQuery();

  // URL state synchronization
  const initialPage = Number(searchParams?.get('page')) || 1;
  const initialLimit = Number(searchParams?.get('limit')) || 10;
  const initialSearch = searchParams?.get('search') || '';
  const initialStatus = searchParams?.get('status') || '';
  const initialCategory = searchParams?.get('categoryId') || '';
  const initialProductType = searchParams?.get('productType') || '';
  const initialSortBy = searchParams?.get('sortBy') || 'updatedAt';
  const initialSortOrder = (searchParams?.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';

  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [searchInput, setSearchInput] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [status, setStatus] = useState<string>(initialStatus);
  const [categoryId, setCategoryId] = useState<string>(initialCategory);
  const [productType, setProductType] = useState<string>(initialProductType);
  const [sortBy, setSortBy] = useState<string>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialSortOrder);

  // Bulk selection state
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

  // Sync state when URL searchParams change
  useEffect(() => {
    const urlStatus = searchParams?.get('status') || '';
    if (urlStatus !== status) {
      setStatus(urlStatus);
      setSelectedInventoryIds([]);
    }
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput !== debouncedSearch) {
        setPage(1);
        setSelectedInventoryIds([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Construct query params object
  const queryParams: ListInventoryParams = useMemo(() => {
    const p: ListInventoryParams = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (status) p.status = status;
    if (categoryId) p.categoryId = categoryId;
    if (productType) p.productType = productType;
    return p;
  }, [page, limit, debouncedSearch, status, categoryId, productType, sortBy, sortOrder]);

  // Fetch Inventory List & Store-wide KPIs
  const {
    data: listResponse,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    refetch: refetchList,
  } = useGetInventoryListQuery(queryParams);

  const { data: kpis, isLoading: isKpisLoading } = useGetInventoryKpisQuery();

  const items: InventoryListItem[] = useMemo(() => {
    if (!listResponse) return [];
    if (Array.isArray(listResponse.data)) return listResponse.data;
    if (Array.isArray((listResponse as any)?.data?.data)) return (listResponse as any).data.data;
    return [];
  }, [listResponse]);


  // Reset selection on pagination change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedInventoryIds([]);
  };

  // Selection toggle handlers
  const handleToggleSelect = (id: string) => {
    setSelectedInventoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    const currentItemIds = items.map((i) => i.id);
    const allSelected =
      currentItemIds.length > 0 && currentItemIds.every((id) => selectedInventoryIds.includes(id));
    if (allSelected) {
      setSelectedInventoryIds((prev) => prev.filter((id) => !currentItemIds.includes(id)));
    } else {
      setSelectedInventoryIds((prev) => Array.from(new Set([...prev, ...currentItemIds])));
    }
  };


  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count += 1;
    if (status && status !== 'LOW_STOCK' && status !== 'OUT_OF_STOCK') count += 1;
    if (categoryId) count += 1;
    if (productType) count += 1;
    return count;
  }, [debouncedSearch, status, categoryId, productType]);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatus('');
    setCategoryId('');
    setProductType('');
    setPage(1);
    setSelectedInventoryIds([]);
    router.push('/dashboard/inventory', { scroll: false });
  };

  const handleTabChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
    setSelectedInventoryIds([]);

    if (newStatus === 'LOW_STOCK') {
      setSortBy('availableQuantity');
      setSortOrder('ASC');
      router.push('/dashboard/inventory?status=LOW_STOCK', { scroll: false });
    } else if (newStatus === 'OUT_OF_STOCK') {
      setSortBy('updatedAt');
      setSortOrder('DESC');
      router.push('/dashboard/inventory?status=OUT_OF_STOCK', { scroll: false });
    } else {
      setSortBy('updatedAt');
      setSortOrder('DESC');
      router.push('/dashboard/inventory', { scroll: false });
    }
  };


  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  const handleAddStockClick = (prodId?: string) => {
    if (prodId) {
      router.push(`/dashboard/inventory/adjust?productId=${prodId}`);
    } else {
      router.push('/dashboard/inventory/adjust');
    }
  };

  const isFiltered = Boolean(debouncedSearch || categoryId || productType || status);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <span>&gt;</span>
            <span className="text-slate-700 font-semibold">Inventory</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your product stock, track inventory and keep your business running smoothly.
          </p>
        </div>

        {/* Top Action Buttons (Mockup Screen 2) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
            title="Export Inventory List"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => handleAddStockClick()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-purple-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </button>
          
          <Link
            href="/dashboard/inventory/qa"
            className="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all ml-1"
            title="More Options (QA, Settings, History)"
          >
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards (Matching Showcase Mockup) */}
      <InventoryKpiCards kpis={kpis} isLoading={isKpisLoading} />

      {/* Recent Inventory Activity & Stock Status Donut Chart (Showcase Screen 1) */}
      <InventoryOverviewSection kpis={kpis} isLoadingKpis={isKpisLoading} />


      {/* Stock Health Quick Navigation Tabs (Solid button style like Screen 6) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => handleTabChange('')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap border ${
            status === '' || (status !== 'LOW_STOCK' && status !== 'OUT_OF_STOCK' && status !== 'IN_STOCK')
              ? 'bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
              : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <span>All ({kpis?.totalItems ?? 1248})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('IN_STOCK')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap border ${
            status === 'IN_STOCK'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm'
              : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <span>In Stock ({kpis ? kpis.totalItems - kpis.lowStockCount - kpis.outOfStockCount : 1130})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('LOW_STOCK')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap border ${
            status === 'LOW_STOCK'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/20'
              : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <span className={`${status === 'LOW_STOCK' ? 'bg-purple-500' : 'bg-slate-100'} px-2 py-0.5 rounded-md`}>Low Stock ({kpis?.lowStockCount ?? 24})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('OUT_OF_STOCK')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap border ${
            status === 'OUT_OF_STOCK'
              ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm'
              : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <span>Out of Stock ({kpis?.outOfStockCount ?? 8})</span>
        </button>
      </div>

      {/* Search & Filters */}
      <InventoryFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        categoryId={categoryId}
        onCategoryChange={(val) => {
          setCategoryId(val);
          setPage(1);
        }}
        productType={productType}
        onProductTypeChange={(val) => {
          setProductType(val);
          setPage(1);
        }}
        activeFilterCount={activeFilterCount}
        onResetFilters={handleResetFilters}
      />

      {/* Main Inventory Table */}
      <InventoryTable
        items={items}
        isLoading={isListLoading}
        isError={isListError}
        sortBy={sortBy}
        sortOrder={sortOrder}
        currentStatusFilter={status}
        selectedIds={selectedInventoryIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
        onAdjustStockClick={handleAddStockClick}
      />

      {/* Pagination Controls */}
      {listResponse?.meta && listResponse.meta.totalPages > 1 && (
        <InventoryPagination
          page={page}
          limit={limit}
          total={listResponse.meta.total}
          totalPages={listResponse.meta.totalPages}
          onPageChange={handlePageChange}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
            setSelectedInventoryIds([]);
          }}
        />
      )}

      {/* Floating Bulk Action Toolbar */}
      {selectedInventoryIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>{selectedInventoryIds.length} {selectedInventoryIds.length === 1 ? 'item' : 'items'} selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/40 transition-all flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bulk Adjust Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedInventoryIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Bulk Stock Adjustment Modal */}
      <BulkAdjustStockModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedItems={items.filter((i) => selectedInventoryIds.includes(i.id))}
        onSuccess={() => {
          setSelectedInventoryIds([]);
          setIsBulkModalOpen(false);
          refetchList();
        }}
      />

    </div>
  );
}

