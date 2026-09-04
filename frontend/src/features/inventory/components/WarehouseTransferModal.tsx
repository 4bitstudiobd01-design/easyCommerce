'use client';

import React, { useState } from 'react';
import {
  useGetWarehousesQuery,
  useGetInventoryStockQuery,
  useGetAllBranchesStockQuery,
  useCreateStockTransferMutation,
  useGetStockTransfersQuery,
  Warehouse,
  InventoryStockItem,
  StockTransfer,
} from '../api/inventoryApi';
import { useGetProductsQuery, Product } from '@/features/catalog/api/catalogApi';
import { useGetBranchesQuery, Branch } from '@/features/tenant/api/tenantApi';
import {
  ArrowRightLeft,
  Warehouse as WarehouseIcon,
  Store as BranchIcon,
  Package,
  Clock,
  ArrowRight,
  Settings2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StockTransferDetailsDrawer } from './StockTransferDetailsDrawer';

export function WarehouseTransferModal() {
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: stockItems = [] } = useGetInventoryStockQuery();
  const { data: branchStockItems = [] } = useGetAllBranchesStockQuery();
  const { data: productRes } = useGetProductsQuery();
  const products = productRes?.data || [];
  const { data: transfersRes, isLoading: isTransfersLoading, isError: isTransfersError } = useGetStockTransfersQuery({ limit: 8 });
  const transfers = transfersRes?.data || [];
  const router = useRouter();

  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));
  const warehouseMap = new Map<string, Warehouse>(warehouses.map((w) => [w.id, w]));
  const branchMap = new Map<string, Branch>(branches.map((b) => [b.id, b]));

  const locationLabel = (
    warehouseRel: Warehouse | undefined,
    warehouseId: string | undefined,
    branchId: string | undefined,
  ) => {
    if (warehouseId) return warehouseRel?.name || warehouseMap.get(warehouseId)?.name || '—';
    if (branchId) return branchMap.get(branchId)?.name || '—';
    return '—';
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Stock Transfers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Move stock between warehouses and branches with real-time inventory updates and transfer logs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/inventory/warehouses"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Settings2 className="w-4 h-4" />
            <span>Manage Warehouses</span>
          </Link>

          <Link
            href="/dashboard/inventory/branches"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <BranchIcon className="w-4 h-4" />
            <span>Manage Branches</span>
          </Link>

          <button
            type="button"
            onClick={() => router.push('/dashboard/warehouse-transfers/create')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer Stock</span>
          </button>
        </div>
      </div>

      {/* WAREHOUSE STOCK OVERVIEW */}
      {warehouses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Warehouses</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
              {warehouses.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((wh) => {
              const whStockItems = stockItems.filter((s) => s.warehouseId === wh.id);
              const totalUnits = whStockItems.reduce((sum, s) => sum + s.quantityOnHand, 0);
              const lowStockCount = whStockItems.filter((s) => s.quantityOnHand <= s.reorderPoint).length;

              return (
                <div key={wh.id} className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <WarehouseIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{wh.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{wh.city || wh.address || 'Main Warehouse'}</p>
                    </div>
                    {wh.isDefault && (
                      <span className="ml-auto px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200 shrink-0">
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
        </div>
      )}

      {/* BRANCH STOCK OVERVIEW */}
      {branches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BranchIcon className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Branches</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
              {branches.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => {
              const branchItems = branchStockItems.filter((s) => s.branchId === branch.id);
              const totalUnits = branchItems.reduce((sum, s) => sum + s.quantityOnHand, 0);
              const lowStockCount = branchItems.filter((s) => s.quantityOnHand <= s.reorderPoint).length;

              return (
                <div key={branch.id} className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                      <BranchIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{branch.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{branch.city || branch.address || 'Branch Outlet'}</p>
                    </div>
                    {branch.isDefault && (
                      <span className="ml-auto px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] rounded-full border border-purple-200 shrink-0">
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
        </div>
      )}

      {/* RECENT STOCK TRANSFERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900">Recent Transfer History</h3>
          </div>
          <Link
            href="/dashboard/warehouse-transfers/history"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-bold">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">From</th>
                <th className="px-6 py-3 text-center">→</th>
                <th className="px-6 py-3">To</th>
                <th className="px-6 py-3 text-center">Quantity</th>
                <th className="px-6 py-3">Transferred By</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isTransfersLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    Loading transfer history...
                  </td>
                </tr>
              ) : isTransfersError ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-rose-500 text-xs font-semibold">
                    Failed to load transfer history. Please refresh the page.
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    No stock transfers yet. Click "Transfer Stock" to move inventory between warehouses or branches.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTransfer(t)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3 font-bold text-slate-900">
                      {productMap.get(t.productId)?.name || productMap.get(t.productId)?.title || 'Product'}
                    </td>
                    <td className="px-6 py-3 text-slate-700">{locationLabel(t.fromWarehouse, t.fromWarehouseId, t.fromBranchId)}</td>
                    <td className="px-6 py-3 text-center">
                      <ArrowRight className="w-4 h-4 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-3 text-slate-700">{locationLabel(t.toWarehouse, t.toWarehouseId, t.toBranchId)}</td>
                    <td className="px-6 py-3 text-center font-extrabold text-slate-900">{t.quantity}</td>
                    <td className="px-6 py-3 text-slate-700">{t.createdByName || t.createdByEmail || '—'}</td>
                    <td className="px-6 py-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockTransferDetailsDrawer
        transfer={selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        productMap={productMap}
        warehouseMap={warehouseMap}
        branchMap={branchMap}
      />
    </div>
  );
}
