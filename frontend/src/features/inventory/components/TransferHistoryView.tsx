'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetStockTransfersQuery,
  useGetWarehousesQuery,
  Warehouse,
  StockTransfer,
} from '../api/inventoryApi';
import { useGetBranchesQuery, Branch } from '@/features/tenant/api/tenantApi';
import { useGetProductsQuery, Product } from '@/features/catalog/api/catalogApi';
import { ArrowLeft, ArrowRight, Search, Clock } from 'lucide-react';
import { InventoryPagination } from './InventoryPagination';
import { StockTransferDetailsDrawer } from './StockTransferDetailsDrawer';

export function TransferHistoryView() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: productRes } = useGetProductsQuery();
  const products = productRes?.data || [];

  const { data: transfersRes, isLoading, isError } = useGetStockTransfersQuery({
    page,
    limit,
    search: search || undefined,
    warehouseId: warehouseId || undefined,
    branchId: branchId || undefined,
  });
  const transfers = transfersRes?.data || [];
  const meta = transfersRes?.meta;

  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));
  const warehouseMap = new Map<string, Warehouse>(warehouses.map((w) => [w.id, w]));
  const branchMap = new Map<string, Branch>(branches.map((b) => [b.id, b]));

  const locationLabel = (
    warehouseRel: Warehouse | undefined,
    whId: string | undefined,
    brId: string | undefined,
  ) => {
    if (whId) return warehouseRel?.name || warehouseMap.get(whId)?.name || '—';
    if (brId) return branchMap.get(brId)?.name || '—';
    return '—';
  };

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">All Stock Transfers</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Full history of stock moved between warehouses and branches.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <select
          value={warehouseId}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="">All Warehouses</option>
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>{wh.name}</option>
          ))}
        </select>

        <select
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {(search || warehouseId || branchId) && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setWarehouseId('');
              setBranchId('');
              setPage(1);
            }}
            className="px-3 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-900">Transfer History</h3>
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    Loading transfer history...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-rose-500 text-xs font-semibold">
                    Failed to load transfer history. Please refresh the page.
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    No stock transfers match these filters.
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

        {meta && meta.totalPages > 1 && (
          <div className="px-6">
            <InventoryPagination
              page={meta.page}
              limit={meta.limit}
              total={meta.total}
              totalPages={meta.totalPages}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        )}
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
