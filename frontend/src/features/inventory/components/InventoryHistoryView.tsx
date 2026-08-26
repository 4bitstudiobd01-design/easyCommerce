'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Layers,
  Warehouse as WarehouseIcon,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Boxes,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  FolderTree,
  Search,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Eye,
  X,
  FileText,
  Filter,
  Box,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetInventoryHistoryQuery,
  useGetInventoryDetailsQuery,
  InventoryHistoryItem,
} from '../api/inventoryApi';

interface InventoryHistoryViewProps {
  inventoryId?: string;
}

const MOVEMENT_TYPES = [
  { value: '', label: 'All Movement Types' },
  { value: 'IN', label: 'Stock In (+)' },
  { value: 'OUT', label: 'Stock Out (-)' },
  { value: 'ADJUSTMENT', label: 'Manual Adjustment' },
  { value: 'INITIAL_STOCK', label: 'Initial Stock' },
  { value: 'RESERVED', label: 'Stock Reserved' },
  { value: 'RELEASED', label: 'Stock Released' },
  { value: 'RETURNED', label: 'Customer Return' },
  { value: 'TRANSFER', label: 'Warehouse Transfer' },
];

const STANDARD_REASONS = [
  { value: '', label: 'All Reasons' },
  { value: 'New Stock Received', label: 'New Stock Received' },
  { value: 'Damaged Items', label: 'Damaged Items' },
  { value: 'Lost Stock', label: 'Lost Stock' },
  { value: 'Manual Correction', label: 'Manual Correction' },
  { value: 'Inventory Audit / Count', label: 'Inventory Audit / Count' },
  { value: 'Customer Return', label: 'Customer Return' },
];

export function InventoryHistoryView({ inventoryId: propInventoryId }: InventoryHistoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inventoryId = propInventoryId || searchParams.get('inventoryId') || undefined;

  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected movement for detail modal
  const [activeMovement, setActiveMovement] = useState<InventoryHistoryItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Fetch optional inventory details for context banner
  const { data: stockDetails } = useGetInventoryDetailsQuery(inventoryId || '', {
    skip: !inventoryId,
  });

  // Query paginated movement history
  const {
    data: historyData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetInventoryHistoryQuery({
    inventoryId,
    params: {
      page,
      limit,
      type: typeFilter || undefined,
      reason: reasonFilter || undefined,
      search: search.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    },
  });

  const movements = historyData?.data || [];
  const meta = historyData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Reset page to 1 when filters change
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setReasonFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || typeFilter || reasonFilter || dateFrom || dateTo,
  );

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('UUID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getTypeBadge = (type: string, delta: number) => {
    switch (type) {
      case 'IN':
      case 'INITIAL_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stock In</span>
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Stock Out</span>
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Adjusted</span>
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-200">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-600" />
            <span>Returned</span>
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Reserved</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
            {type}
          </span>
        );
    }
  };

  const product = stockDetails?.product;
  const variant = stockDetails?.variant;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="space-y-1">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <span>&gt;</span>
          <Link href="/dashboard/inventory" className="hover:text-slate-600 transition-colors">
            Inventory
          </Link>
          <span>&gt;</span>
          {stockDetails && (
            <>
              <Link
                href={`/dashboard/inventory/${stockDetails.id}`}
                className="hover:text-slate-600 transition-colors truncate max-w-[150px]"
              >
                {product?.name || 'Item'}
              </Link>
              <span>&gt;</span>
            </>
          )}
          <span className="text-slate-700 font-semibold">Movement History</span>
        </nav>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Inventory Movement History
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable audit ledger of physical adjustments, allocations, and stock events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
              title="Export History Ledger"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export</span>
            </button>
            {stockDetails && (
              <Link
                href={`/dashboard/inventory/adjust?inventoryId=${stockDetails.id}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Adjust Stock</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Product Context Banner (when viewing for specific inventory item) */}
      {stockDetails && product && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
              {product.thumbnail ? (
                <Image
                  src={product.thumbnail}
                  alt={product.name}
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
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/inventory/${stockDetails.id}`}
                  className="font-extrabold text-slate-900 hover:text-blue-600 transition-colors text-sm"
                >
                  {product.name}
                </Link>
                {variant && (
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {variant.title}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-slate-400 mt-0.5">
                SKU: {product.sku || 'No SKU'} • Warehouse: {stockDetails.warehouse.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                On Hand
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                {stockDetails.quantityOnHand}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Reserved
              </span>
              <span className="text-xs font-extrabold text-amber-600">
                {stockDetails.quantityReserved}
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 text-center">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Available
              </span>
              <span className="text-xs font-extrabold text-blue-700">
                {stockDetails.availableQuantity}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              placeholder="Search reference, reason, note..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Type Dropdown */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason Dropdown */}
          <div>
            <select
              value={reasonFilter}
              onChange={(e) => handleFilterChange(setReasonFilter, e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            >
              {STANDARD_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter & Reset */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleFilterChange(setDateFrom, e.target.value)}
              className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              title="From Date"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
                title="Reset Filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                {!stockDetails && <th className="py-3 px-4">Product</th>}
                {!stockDetails && <th className="py-3 px-4">Variant</th>}
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-center">Before</th>
                <th className="py-3 px-4 text-center">After</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-slate-200 rounded-md" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-12 bg-slate-200 rounded ml-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 w-20 bg-slate-200 rounded mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 w-14 bg-slate-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {hasActiveFilters ? 'No Matching Movements Found' : 'No Movement History Recorded'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters
                          ? 'Try adjusting or clearing your filters to see more historical ledger records.'
                          : 'Physical adjustments, allocations, and stock changes will appear here automatically.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setActiveMovement(m)}
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTime(m.createdAt)}</span>
                      </div>
                    </td>

                    {/* Product & Variant (Global Only) */}
                    {!stockDetails && (
                      <>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-900 font-semibold max-w-[150px] truncate">
                          {m.product?.name || '—'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {m.variant?.title || '—'}
                        </td>
                      </>
                    )}

                    {/* Movement Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getTypeBadge(m.type, m.quantityDelta)}
                    </td>

                    {/* Quantity Delta */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-extrabold text-xs px-2 py-0.5 rounded-md ${
                          m.quantityDelta > 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : m.quantityDelta < 0
                            ? 'text-rose-700 bg-rose-50'
                            : 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    </td>

                    {/* Before */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-500 font-medium">
                        {m.quantityBefore}
                      </span>
                    </td>

                    {/* After */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-900 font-bold">
                        {m.quantityAfter}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="truncate max-w-[180px] block" title={m.reason}>
                        {m.reason}
                      </span>
                    </td>

                    {/* Reference */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {m.referenceId ? (
                        <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {m.referenceId}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Performed By */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="truncate max-w-[120px]">
                          {m.performedBy || 'System'}
                        </span>
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
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} movements
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

      {/* Movement Details Modal */}
      {activeMovement && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative">
            <div className="h-2 bg-blue-600" />

            <div className="p-6 space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Movement Ledger Record
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Immutable historical transaction record
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveMovement(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Movement Details Content */}
              <div className="space-y-3.5 text-xs">
                {/* Movement UUID */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Movement UUID
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <span className="font-mono text-[11px] text-slate-600 truncate">
                      {activeMovement.id}
                    </span>
                    <button
                      onClick={() => handleCopy(activeMovement.id)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
                      title="Copy UUID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Grid Comparison */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Previous
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                      {activeMovement.quantityBefore}
                    </span>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      Delta
                    </span>
                    <span
                      className={`text-sm font-extrabold mt-0.5 block ${
                        activeMovement.quantityDelta > 0
                          ? 'text-emerald-700'
                          : activeMovement.quantityDelta < 0
                          ? 'text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {activeMovement.quantityDelta > 0
                        ? `+${activeMovement.quantityDelta}`
                        : activeMovement.quantityDelta}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Resulting
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                      {activeMovement.quantityAfter}
                    </span>
                  </div>
                </div>

                {/* Key Attributes */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Event Type:</span>
                    {getTypeBadge(activeMovement.type, activeMovement.quantityDelta)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Reason:</span>
                    <span className="font-bold text-slate-900">{activeMovement.reason}</span>
                  </div>

                  {activeMovement.referenceId && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Reference:</span>
                      <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {activeMovement.referenceId}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Performed By:</span>
                    <span className="font-semibold text-slate-800">
                      {activeMovement.performedBy || 'System Automation'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="font-semibold text-slate-800">
                      {formatDateTime(activeMovement.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {activeMovement.note && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Audit Notes
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {activeMovement.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveMovement(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
