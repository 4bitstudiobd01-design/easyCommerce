'use client';

import React from 'react';
import { useGetInventoryStocksQuery, InventoryStock } from '../api/inventoryApi';
import { Boxes, Warehouse, AlertTriangle, CheckCircle2, XCircle, SlidersHorizontal } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

interface InventoryStockTableProps {
  onAdjustStockClick?: (productId?: string) => void;
}

export function InventoryStockTable({ onAdjustStockClick }: InventoryStockTableProps) {
  const { data: stocks = [], isLoading, isError } = useGetInventoryStocksQuery();

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
            <TableRowSkeleton columns={7} />
            <TableRowSkeleton columns={7} />
            <TableRowSkeleton columns={7} />
            <TableRowSkeleton columns={7} />
          </tbody>
        </table>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Boxes className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">No Inventory Stock Recorded</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Create products in catalog and adjust your warehouse stock levels to start tracking inventory.
        </p>
        {onAdjustStockClick && (
          <button
            onClick={() => onAdjustStockClick()}
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all inline-flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Adjust First Stock</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900">Warehouse Inventory Stock</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical stock counts, allocations, and reorder points
          </p>
        </div>

        {onAdjustStockClick && (
          <button
            onClick={() => onAdjustStockClick()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Adjust Stock</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Product & SKU</th>
              <th className="px-6 py-3.5">Warehouse Location</th>
              <th className="px-6 py-3.5">On-Hand Stock</th>
              <th className="px-6 py-3.5">Reserved</th>
              <th className="px-6 py-3.5">Available Stock</th>
              <th className="px-6 py-3.5">Stock Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {stocks.map((stock) => (
              <tr key={stock.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {stock.productTitle}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      SKU: {stock.sku}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 inline-flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-slate-400" />
                    <span>{stock.warehouseName}</span>
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {stock.quantityOnHand} units
                  </span>
                </td>

                <td className="px-6 py-4 text-slate-500">
                  <span>{stock.quantityReserved} units</span>
                </td>

                <td className="px-6 py-4">
                  <span className="font-extrabold text-blue-600 text-sm">
                    {stock.availableQuantity} units
                  </span>
                </td>

                <td className="px-6 py-4">
                  {stock.isOutOfStock ? (
                    <span className="px-2.5 py-0.5 bg-red-50 text-red-700 font-bold text-[10px] rounded-full border border-red-200 inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      <span>Out of Stock</span>
                    </span>
                  ) : stock.isLowStock ? (
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full border border-amber-200 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Low Stock (&le; {stock.reorderPoint})</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>In Stock</span>
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  {onAdjustStockClick && (
                    <button
                      onClick={() => onAdjustStockClick(stock.productId)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-bold text-xs rounded-xl transition-colors"
                    >
                      Update Stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
