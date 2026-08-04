'use client';

import React, { useState } from 'react';
import {
  useGetWarehousesQuery,
  useGetInventoryStockQuery,
  useCreateStockTransferMutation,
  useGetStockTransfersQuery,
  Warehouse,
  InventoryStockItem,
} from '../api/inventoryApi';
import { useGetProductsQuery, Product } from '@/features/catalog/api/catalogApi';
import {
  ArrowRightLeft,
  Warehouse as WarehouseIcon,
  Package,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
export function WarehouseTransferModal() {
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: stockItems = [] } = useGetInventoryStockQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: transfers = [] } = useGetStockTransfersQuery();
  const router = useRouter();

  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));
  const warehouseMap = new Map<string, Warehouse>(warehouses.map((w) => [w.id, w]));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Multi-Warehouse Stock Transfer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Move stock between warehouses with real-time inventory updates and transfer logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard/warehouse-transfers/create')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transfer Stock</span>
        </button>
      </div>

      {/* WAREHOUSE STOCK OVERVIEW */}
      {warehouses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => {
            const whStockItems = stockItems.filter((s) => s.warehouseId === wh.id);
            const totalUnits = whStockItems.reduce((sum, s) => sum + s.quantityOnHand, 0);
            const lowStockCount = whStockItems.filter((s) => s.quantityOnHand <= s.reorderPoint).length;

            return (
              <div key={wh.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <WarehouseIcon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{wh.name}</p>
                    <p className="text-[11px] text-slate-500">{wh.city || wh.address || 'Main Warehouse'}</p>
                  </div>
                  {wh.isDefault && (
                    <span className="ml-auto px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{totalUnits} total units</span>
                  {lowStockCount > 0 && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold text-[10px] rounded-full border border-amber-200">
                      ⚠ {lowStockCount} low stock
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECENT STOCK TRANSFERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-900">Recent Transfer History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-bold">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">From Warehouse</th>
                <th className="px-6 py-3 text-center">→</th>
                <th className="px-6 py-3">To Warehouse</th>
                <th className="px-6 py-3 text-center">Quantity</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    No stock transfers yet. Click "Transfer Stock" to move inventory between warehouses.
                  </td>
                </tr>
              ) : (
                transfers.slice(0, 15).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-900">
                      {productMap.get(t.productId)?.title || 'Product'}
                    </td>
                    <td className="px-6 py-3 text-slate-700">{t.fromWarehouse?.name || warehouseMap.get(t.fromWarehouseId)?.name || '—'}</td>
                    <td className="px-6 py-3 text-center">
                      <ArrowRight className="w-4 h-4 text-purple-500 mx-auto" />
                    </td>
                    <td className="px-6 py-3 text-slate-700">{t.toWarehouse?.name || warehouseMap.get(t.toWarehouseId)?.name || '—'}</td>
                    <td className="px-6 py-3 text-center font-extrabold text-slate-900">{t.quantity}</td>
                    <td className="px-6 py-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
