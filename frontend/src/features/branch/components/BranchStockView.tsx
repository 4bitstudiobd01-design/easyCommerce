'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useGetBranchesQuery } from '@/features/tenant/api/tenantApi';
import { useGetBranchStockQuery } from '@/features/inventory/api/inventoryApi';

interface BranchStockViewProps {
  branchId: string;
}

export function BranchStockView({ branchId }: BranchStockViewProps) {
  const router = useRouter();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: stock = [], isLoading, isError } = useGetBranchStockQuery(branchId, { skip: !branchId });

  const branch = branches.find((b) => b.id === branchId);

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {branch?.name || 'Branch'} — Stock
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Products and variants currently held at this branch.
          </p>
        </div>

        <Link
          href="/dashboard/warehouse-transfers/create"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transfer Stock</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading stock...</div>
        ) : isError ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-slate-700">Failed to load branch stock.</p>
            <p className="text-xs text-slate-400 mt-1">Please refresh the page and try again.</p>
          </div>
        ) : stock.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">No stock at this branch yet</p>
            <p className="text-xs text-slate-400">Transfer stock in from a warehouse to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-bold">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Variant</th>
                  <th className="px-6 py-3 text-center">On Hand</th>
                  <th className="px-6 py-3 text-center">Reserved</th>
                  <th className="px-6 py-3 text-center">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((item) => {
                  const available = item.quantityOnHand - item.quantityReserved;
                  const isLow = available <= item.reorderPoint;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-900">
                        {item.product?.name || item.product?.title || item.productId}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {item.variant?.name || item.variant?.sku || '—'}
                      </td>
                      <td className="px-6 py-3 text-center font-extrabold text-slate-900">{item.quantityOnHand}</td>
                      <td className="px-6 py-3 text-center text-slate-500">{item.quantityReserved}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold ${isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {available}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
