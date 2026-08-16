'use client';

import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useGetAnalyticsOverviewQuery } from '@/features/analytics/api/analyticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function TopProductsList() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

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
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const topSellingProducts = data?.topSellingProducts || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-[15px] font-bold text-slate-900">Top products</h3>
        <Link
          href="/dashboard/products"
          className="text-[13px] font-semibold text-blue-600 hover:text-blue-700"
        >
          View products
        </Link>
      </div>

      {topSellingProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center flex-1 px-6">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-900 mb-1">No sales data</p>
          <p className="text-xs text-slate-500">Products will appear here once sold.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-6 pb-6">
          <ul className="space-y-4">
            {topSellingProducts.slice(0, 5).map((prod) => {
              const soldCount = prod.totalQuantity || 0;

              return (
                <li key={prod.productId} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/50 group-hover:border-slate-300 transition-colors">
                      <Package className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors line-clamp-1" title={prod.title}>
                      {prod.title}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col text-right pl-3">
                    <span className="text-[13px] font-bold text-slate-900">
                      ৳{Number(prod.totalRevenue).toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {soldCount} sold
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
