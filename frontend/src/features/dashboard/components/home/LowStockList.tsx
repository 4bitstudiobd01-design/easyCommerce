'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, PackageMinus } from 'lucide-react';
import { useGetInventoryStocksQuery } from '@/features/inventory/api/inventoryApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function LowStockList() {
  const { data: stocks = [], isLoading } = useGetInventoryStocksQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
        <h3 className="text-[15px] font-bold text-slate-900 mb-4">Low stock</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const lowStockItems = stocks
    .filter((s) => s.isOutOfStock || s.isLowStock || (s.availableQuantity ?? s.quantityOnHand) <= s.reorderPoint)
    .sort((a, b) => (a.availableQuantity ?? a.quantityOnHand) - (b.availableQuantity ?? b.quantityOnHand))
    .slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-slate-900">Low stock</h3>
        {lowStockItems.length > 0 && (
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 group"
          >
            View inventory
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {lowStockItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <PackageMinus className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-900 mb-1">Inventory is healthy</p>
          <p className="text-xs text-slate-500">No products are running low.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 pb-2 border-b border-slate-100">
            <span>Product</span>
            <span>Stock</span>
          </div>
          <ul className="space-y-3">
            {lowStockItems.map((item) => {
              const stock = item.availableQuantity ?? item.quantityOnHand;
              const isZero = stock <= 0;
              return (
                <li key={item.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 truncate" title={item.productTitle}>
                      {item.productTitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-[13px] font-bold ${isZero ? 'text-red-600' : 'text-amber-600'}`}>
                      {stock} left
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
