'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  useGetCustomersQuery,
  useGetCustomerKpisQuery,
  useUpdateCustomerStatusMutation,
  useBulkUpdateCustomerStatusMutation,
  Customer,
  CustomerStatusType,
  CustomerSourceType,
} from '@/features/customer/api/customerApi';
import { CustomerKpiCards } from '@/features/customer/components/CustomerKpiCards';
import { CustomerFilterBar } from '@/features/customer/components/CustomerFilterBar';
import { CustomerTabs } from '@/features/customer/components/CustomerTabs';
import { CustomerTable } from '@/features/customer/components/CustomerTable';
import { CustomerDetailDrawer } from '@/features/customer/components/CustomerDetailDrawer';
import { AddCustomerModal } from '@/features/customer/components/AddCustomerModal';
import { EditCustomerModal } from '@/features/customer/components/EditCustomerModal';
import { ImportCustomersModal } from '@/features/customer/components/ImportCustomersModal';
import { CustomerAnalyticsView } from '@/features/customer/components/CustomerAnalyticsView';
import { CustomerSegmentsView } from '@/features/customer/components/CustomerSegmentsView';

import { Plus, Download, Upload, ChevronLeft, ChevronRight, UserX, UserCheck, ShieldAlert, ShieldCheck, X, Loader2, Users, BarChart3, Sparkles, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

export default function CustomersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active View Switcher Tab: 'directory' | 'analytics' | 'segments'
  const activeView = (searchParams.get('view') as 'directory' | 'analytics' | 'segments') || 'directory';

  // URL Query Parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const statusParam = (searchParams.get('status') as CustomerStatusType | 'ALL') || 'ALL';
  const sourceParam = (searchParams.get('source') as CustomerSourceType | 'ALL') || 'ALL';
  const segmentIdParam = searchParams.get('segmentId') || '';
  const dateRangeParam = searchParams.get('dateRange') || 'ALL';
  const sortByParam = searchParams.get('sortBy') || 'createdAt';
  const sortOrderParam = (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';
  const initialSearch = searchParams.get('search') || '';

  // Search input state with debouncing
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Sync debounced search to URL query
  useEffect(() => {
    const currentUrlSearch = searchParams.get('search') || '';
    if (debouncedSearch !== currentUrlSearch) {
      updateUrlParams({ search: debouncedSearch || null, page: '1' });
    }
  }, [debouncedSearch]);

  // Drawer, modal & selection state
  const [selectedDrawerCustomerId, setSelectedDrawerCustomerId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk action confirmation state
  const [bulkActionTarget, setBulkActionTarget] = useState<CustomerStatusType | null>(null);

  // Mutations
  const [updateStatus] = useUpdateCustomerStatusMutation();
  const [bulkUpdateStatus, { isLoading: isBulkUpdating }] = useBulkUpdateCustomerStatusMutation();

  // Helper to update URL params cleanly
  const updateUrlParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Queries
  const { data: kpis, isLoading: isKpisLoading } = useGetCustomerKpisQuery();

  const queryParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusParam === 'ALL' ? undefined : statusParam,
    source: sourceParam === 'ALL' ? undefined : sourceParam,
    segmentId: segmentIdParam || undefined,
    dateRange: dateRangeParam === 'ALL' ? undefined : dateRangeParam,
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
  };

  const { data: customersResponse, isLoading: isCustomersLoading, isFetching, isError } = useGetCustomersQuery(queryParams);

  const customers = customersResponse?.data || [];
  const meta = customersResponse?.meta || { page: 1, limit: 20, total: 0, totalPages: 0, statusCounts: { ALL: 0, ACTIVE: 0, INACTIVE: 0, BLOCKED: 0 } };

  // Coming from an order's "View profile" link (?search=phone&autoOpen=1): once the
  // filtered list resolves, open the matching customer's drawer directly instead of
  // making the merchant click the row themselves, then drop the flag from the URL.
  useEffect(() => {
    if (searchParams.get('autoOpen') !== '1' || isCustomersLoading || isFetching) return;
    if (customers.length > 0) {
      setSelectedDrawerCustomerId(customers[0].id);
    }
    updateUrlParams({ autoOpen: null });
  }, [searchParams, isCustomersLoading, isFetching, customers]);

  // Out-of-range page guard
  useEffect(() => {
    if (meta.totalPages > 0 && page > meta.totalPages) {
      updateUrlParams({ page: meta.totalPages.toString() });
    }
  }, [meta.totalPages, page]);

  // Clear selection on page/filter change
  useEffect(() => {
    setSelectedIds([]);
  }, [page, statusParam, sourceParam, segmentIdParam, dateRangeParam, debouncedSearch]);

  const hasActiveFilters = Boolean(
    debouncedSearch || statusParam !== 'ALL' || sourceParam !== 'ALL' || segmentIdParam || dateRangeParam !== 'ALL',
  );

  const handleClearFilters = () => {
    setSearchInput('');
    updateUrlParams({ search: null, status: null, source: null, segmentId: null, dateRange: null, page: '1' });
  };

  const handleSortChange = (field: string) => {
    if (sortByParam === field) {
      const nextSortOrder = sortOrderParam === 'ASC' ? 'DESC' : 'ASC';
      updateUrlParams({ sortOrder: nextSortOrder, page: '1' });
    } else {
      updateUrlParams({ sortBy: field, sortOrder: 'DESC', page: '1' });
    }
  };

  const handleToggleStatus = async (cust: Customer) => {
    const targetStatus: CustomerStatusType = cust.status === 'BLOCKED' ? 'ACTIVE' : cust.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      await updateStatus({ id: cust.id, status: targetStatus }).unwrap();
      toast.success(`Customer status updated to ${targetStatus}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleConfirmBulkAction = async () => {
    if (!bulkActionTarget || selectedIds.length === 0) return;

    try {
      const res = await bulkUpdateStatus({ customerIds: selectedIds, status: bulkActionTarget }).unwrap();
      const statusLabel = bulkActionTarget === 'BLOCKED' ? 'blocked' : bulkActionTarget === 'ACTIVE' ? 'activated' : 'deactivated';
      toast.success(`Successfully ${statusLabel} ${res.affected} customers.`);
      setSelectedIds([]);
      setBulkActionTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update selected customers');
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/customers';
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusParam !== 'ALL') params.set('status', statusParam);
      if (sourceParam !== 'ALL') params.set('source', sourceParam);
      if (segmentIdParam) params.set('segmentId', segmentIdParam);
      if (dateRangeParam !== 'ALL') params.set('dateRange', dateRangeParam);
      if (sortByParam) params.set('sortBy', sortByParam);
      if (sortOrderParam) params.set('sortOrder', sortOrderParam);

      const token = typeof window !== 'undefined' ? localStorage.getItem('bitcommerce_token') : null;
      const activeStoreId = typeof window !== 'undefined' ? localStorage.getItem('bitcommerce_active_store_id') : null;

      const headers: Record<string, string> = {};
      if (token) headers['authorization'] = `Bearer ${token}`;
      if (activeStoreId) headers['x-store-id'] = activeStoreId;

      const response = await fetch(`${baseUrl}/export?${params.toString()}`, { headers });
      if (!response.ok) throw new Error('Export request failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Customer CSV export generated successfully!');
    } catch (err: any) {
      toast.error('Failed to export customer CSV file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-slate-700">Customers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customers</h1>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Download className="w-3.5 h-3.5" />}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Add Customer
          </button>
        </div>
      </div>

      {/* 2. VIEW SWITCHER NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-2xs inline-flex items-center gap-1">
        <button
          onClick={() => updateUrlParams({ view: null })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeView === 'directory'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Customer Directory
        </button>

        <button
          onClick={() => updateUrlParams({ view: 'analytics' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeView === 'analytics'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Analytics & Reports
        </button>

        <button
          onClick={() => updateUrlParams({ view: 'segments' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeView === 'segments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Segments & Groups
        </button>
      </div>

      {/* ACTIVE SEGMENT FILTER BANNER */}
      {segmentIdParam && activeView === 'directory' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-indigo-900 font-medium">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Active Segment Filter applied to customer directory.</span>
          </div>
          <button
            onClick={() => updateUrlParams({ segmentId: null, page: '1' })}
            className="px-2.5 py-1 bg-white text-indigo-700 font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 text-[11px]"
          >
            <X className="w-3 h-3" />
            Clear Segment Filter
          </button>
        </div>
      )}

      {/* VIEW PANEL 1: ANALYTICS & REPORTS (CHUNK 9) */}
      {activeView === 'analytics' && (
        <CustomerAnalyticsView
          onSelectCustomer={(id) => setSelectedDrawerCustomerId(id)}
        />
      )}

      {/* VIEW PANEL 2: SEGMENTS & GROUPS (CHUNK 9) */}
      {activeView === 'segments' && (
        <CustomerSegmentsView
          onViewSegmentCustomers={(segId) => updateUrlParams({ view: null, segmentId: segId, page: '1' })}
        />
      )}

      {/* VIEW PANEL 3: CUSTOMER DIRECTORY (CHUNKS 1-8) */}
      {activeView === 'directory' && (
        <>
          {/* STICKY BULK ACTION TOOLBAR */}
          {selectedIds.length > 0 && (
            <div className="sticky top-4 z-30 bg-slate-900 text-white rounded-2xl p-3 px-5 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-200">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-blue-600 font-black text-xs rounded-lg">
                  {selectedIds.length} Selected
                </span>
                <span className="text-xs text-slate-300 hidden md:inline">
                  Perform bulk status action on selected customer records
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkActionTarget('ACTIVE')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Activate
                </button>

                <button
                  onClick={() => setBulkActionTarget('INACTIVE')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Deactivate
                </button>

                <button
                  onClick={() => setBulkActionTarget('BLOCKED')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Block
                </button>

                <button
                  onClick={() => setSelectedIds([])}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-2"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* BULK ACTION CONFIRMATION MODAL */}
          {bulkActionTarget && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                    bulkActionTarget === 'BLOCKED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {bulkActionTarget === 'BLOCKED' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Confirm Bulk {bulkActionTarget === 'BLOCKED' ? 'Block' : bulkActionTarget === 'ACTIVE' ? 'Activation' : 'Deactivation'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Are you sure you want to update status for {selectedIds.length} selected customers?
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 leading-relaxed">
                  {bulkActionTarget === 'BLOCKED'
                    ? 'Blocking customers will restrict account interactions. Existing order history, addresses, notes, and activity timeline will remain intact.'
                    : 'Customer status will be updated immediately.'}
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setBulkActionTarget(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBulkAction}
                    disabled={isBulkUpdating}
                    className={`px-4 py-2 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 ${
                      bulkActionTarget === 'BLOCKED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isBulkUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      `Confirm ${bulkActionTarget === 'BLOCKED' ? 'Block' : 'Update'}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KPI CARDS */}
          <CustomerKpiCards kpis={kpis} isLoading={isKpisLoading} />

          {/* FILTER BAR */}
          <CustomerFilterBar
            searchQuery={searchInput}
            onSearchChange={(q) => setSearchInput(q)}
            statusFilter={statusParam}
            onStatusChange={(status) => updateUrlParams({ status, page: '1' })}
            sourceFilter={sourceParam}
            onSourceChange={(source) => updateUrlParams({ source, page: '1' })}
            dateRangeFilter={dateRangeParam}
            onDateRangeChange={(range) => updateUrlParams({ dateRange: range, page: '1' })}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* CUSTOMER TABS */}
          <CustomerTabs
            activeTab={statusParam}
            onTabChange={(tab) => updateUrlParams({ status: tab, page: '1' })}
            statusCounts={meta.statusCounts}
          />

          {/* CUSTOMER TABLE */}
          {isError ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-md mx-auto my-6">
              <h3 className="font-extrabold text-base text-rose-700">Unable to load customers</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                A network or server error occurred while retrieving customer records.
              </p>
              <button
                onClick={() => router.refresh()}
                className="mt-4 px-4 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <CustomerTable
              customers={customers}
              isLoading={isCustomersLoading || isFetching}
              onSelectCustomer={(cust) => setSelectedDrawerCustomerId(cust.id)}
              onEditCustomer={(cust) => setEditingCustomer(cust)}
              onToggleStatus={handleToggleStatus}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
              sortBy={sortByParam}
              sortOrder={sortOrderParam}
              onSortChange={handleSortChange}
              searchQuery={debouncedSearch}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          )}

          {/* PAGINATION FOOTER */}
          {customers.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 shadow-2xs">
              <div className="flex items-center gap-4">
                <span>
                  Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} customers
                </span>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-[11px] text-slate-400">Show:</span>
                  <select
                    value={limit}
                    onChange={(e) => updateUrlParams({ limit: e.target.value, page: '1' })}
                    aria-label="Select page size"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateUrlParams({ page: (meta.page - 1).toString() })}
                  disabled={meta.page <= 1 || isFetching}
                  aria-label="Previous page"
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
                  Page {meta.page} of {meta.totalPages || 1}
                </div>

                <button
                  onClick={() => updateUrlParams({ page: (meta.page + 1).toString() })}
                  disabled={meta.page >= meta.totalPages || isFetching}
                  aria-label="Next page"
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CUSTOMER DETAIL DRAWER */}
      <CustomerDetailDrawer
        customerId={selectedDrawerCustomerId}
        onClose={() => setSelectedDrawerCustomerId(null)}
        onEdit={() => {
          const cust = customers.find((c) => c.id === selectedDrawerCustomerId);
          if (cust) {
            setEditingCustomer(cust);
          }
        }}
        onToggleStatus={() => {
          const cust = customers.find((c) => c.id === selectedDrawerCustomerId);
          if (cust) {
            handleToggleStatus(cust);
          }
        }}
      />

      {/* ADD CUSTOMER MODAL */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* EDIT CUSTOMER MODAL */}
      <EditCustomerModal
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
      />

      {/* IMPORT CUSTOMERS MODAL (CHUNK 8) */}
      <ImportCustomersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
