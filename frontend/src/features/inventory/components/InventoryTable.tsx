'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  ExternalLink,
  Inbox,
  RotateCcw,
  History,
  AlertTriangle,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  XCircle,
} from 'lucide-react';
import { InventoryListItem } from '../api/inventoryApi';

interface InventoryTableProps {
  items: InventoryListItem[];
  isLoading: boolean;
  isError: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  currentStatusFilter?: string;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onSortChange: (field: string) => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  onAdjustStockClick: (productId?: string) => void;
}

export function InventoryTable({
  items,
  isLoading,
  isError,
  sortBy,
  sortOrder,
  currentStatusFilter,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onSortChange,
  onResetFilters,
  isFiltered,
  onAdjustStockClick,
}: InventoryTableProps) {
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.action-dropdown')) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activeDropdown]);

  const getStatusBadge = (status: InventoryListItem['status']) => {
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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              <div className="space-y-1.5">
                <div className="w-36 h-3.5 bg-slate-200 rounded" />
                <div className="w-20 h-2.5 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-24 h-3 bg-slate-200 rounded hidden md:block" />
            <div className="w-16 h-3 bg-slate-200 rounded hidden sm:block" />
            <div className="w-16 h-3 bg-slate-200 rounded" />
            <div className="w-20 h-6 bg-slate-200 rounded-full" />
            <div className="w-16 h-7 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Failed to load inventory</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          An error occurred while communicating with the inventory service. Please refresh or try again.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    if (currentStatusFilter === 'LOW_STOCK') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No low-stock items</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your current inventory is above its configured stock thresholds. All tracked items are healthy.
          </p>
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      );
    }

    if (currentStatusFilter === 'OUT_OF_STOCK') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No out-of-stock items</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All currently tracked inventory has available stock ready for sale.
          </p>
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <Inbox className="w-6 h-6" />
        </div>
        {isFiltered ? (
          <>
            <h3 className="text-base font-bold text-slate-800">No matching inventory items</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No inventory records matched your search and filter criteria. Try adjusting or resetting your filters.
            </p>
            <button
              onClick={onResetFilters}
              className="mt-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          </>
        ) : (
          <>
            <h3 className="text-base font-bold text-slate-800">No inventory items found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not created any products with inventory tracking yet. Create products in your catalog to start tracking stock.
            </p>
            <Link
              href="/dashboard/products/create"
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-all"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Create Product</span>
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all visible inventory on this page"
                  checked={items.length > 0 && items.every((i) => selectedIds.includes(i.id))}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">
                <button
                  onClick={() => onSortChange('name')}
                  className="inline-flex items-center gap-1 hover:text-slate-800 focus:outline-none"
                >
                  <span>Product</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4">
                <button
                  onClick={() => onSortChange('sku')}
                  className="inline-flex items-center gap-1 hover:text-slate-800 focus:outline-none"
                >
                  <span>SKU</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4">Variant</th>
              <th className="py-3 px-4 text-right">
                <button
                  onClick={() => onSortChange('quantityOnHand')}
                  className="inline-flex items-center gap-1 hover:text-slate-800 focus:outline-none ml-auto"
                >
                  <span>Stock</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">Threshold</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">
                <button
                  onClick={() => onSortChange('updatedAt')}
                  className="inline-flex items-center gap-1 hover:text-slate-800 focus:outline-none ml-auto"
                >
                  <span>Updated</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.productName}`}
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(item.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  {/* Product Column */}
                  <td className="py-3.5 px-4">

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.productThumbnail ? (
                        <Image
                          src={item.productThumbnail}
                          alt={item.productName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/inventory/${item.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-1"
                      >
                        <span>{item.productName}</span>
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        {item.categoryName && (
                          <span className="truncate max-w-[120px]">{item.categoryName}</span>
                        )}
                        {item.warehouseName && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{item.warehouseName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* SKU Column */}
                <td className="py-3.5 px-4">
                  <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.sku || '—'}
                  </span>
                </td>

                {/* Variant Column */}
                <td className="py-3.5 px-4">
                  {item.variantTitle ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-100">
                      <Layers className="w-3 h-3" />
                      <span className="truncate max-w-[140px]">{item.variantTitle}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium text-[11px]">Default</span>
                  )}
                </td>

                {/* Physical Stock Column */}
                <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                  {item.quantityOnHand.toLocaleString()}
                </td>

                {/* Threshold Column */}
                <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                  {item.lowStockThreshold.toLocaleString()}
                </td>

                {/* Status Column */}
                <td className="py-3.5 px-4 text-center">
                  {getStatusBadge(item.status)}
                </td>

                {/* Updated Timestamp Column */}
                <td className="py-3.5 px-4 text-right text-slate-500 font-medium text-[11px]">
                  {formatDate(item.updatedAt)}
                </td>

                {/* Actions Column */}
                <td className="py-3.5 px-4 text-right relative">
                  <div className="action-dropdown relative inline-block text-left">
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      aria-expanded={activeDropdown === item.id}
                      aria-haspopup="true"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeDropdown === item.id && (
                      <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200/80 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden text-left origin-top-right animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-1.5" role="none">
                          <Link
                            href={`/dashboard/inventory/${item.id}`}
                            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </Link>
                          
                          <button
                            onClick={() => {
                              setActiveDropdown(null);
                              onAdjustStockClick(item.productId);
                            }}
                            className="flex items-center w-full gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                            <span>Adjust Stock</span>
                          </button>

                          <Link
                            href={`/dashboard/inventory/${item.id}/history`}
                            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                            <History className="w-3.5 h-3.5 text-slate-400" />
                            <span>Movement History</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
}

