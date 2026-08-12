'use client';

import React from 'react';
import Link from 'next/link';
import { PackageMinus, Package } from 'lucide-react';
import { useGetInventoryStocksQuery } from '@/features/inventory/api/inventoryApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function LowStockList() {
  const { data: stocks = [], isLoading } = useGetInventoryStocksQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-md" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-12" />
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-[15px] font-bold text-slate-900">Low stock</h3>
        <Link
          href="/dashboard/inventory"
          className="text-[13px] font-semibold text-blue-600 hover:text-blue-700"
        >
          View inventory
        </Link>
      </div>

      {lowStockItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center flex-1 px-6">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <PackageMinus className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-900 mb-1">Inventory is healthy</p>
          <p className="text-xs text-slate-500">No products are running low.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-6 pb-6">
          <ul className="space-y-4">
            {lowStockItems.map((item) => {
              const stock = item.availableQuantity ?? item.quantityOnHand;
              const isCriticallyLow = stock <= 3;
              const imageUrl = (item as any).productImageUrl || (item as any).imageUrl; // fallback to any available image property

              return (
                <li key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/50 group-hover:border-slate-300 transition-colors">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                      )}
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors line-clamp-1" title={item.productTitle}>
                      {item.productTitle}
                    </p>
                  </div>
                  <div className="shrink-0 pl-3">
                    <span className={`text-[13px] font-bold ${isCriticallyLow ? 'text-red-600' : 'text-orange-500'}`}>
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
