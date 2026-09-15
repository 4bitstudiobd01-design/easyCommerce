'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function TopPerformingProducts() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const products = (data?.topSellingProducts || []).slice(0, 5);
  const max = Math.max(1, ...products.map((p) => p.totalRevenue));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Top Performing Products</h3>
      </div>

      {products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <Package className="w-6 h-6 text-slate-300" />
          <p className="text-slate-500 font-medium text-xs">No sales recorded yet.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between gap-4">
          {products.map((product) => (
            <div key={product.productId} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{product.title}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900">৳{product.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="ml-11 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(product.totalRevenue / max) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
