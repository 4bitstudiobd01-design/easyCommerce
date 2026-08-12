'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { useGetAnalyticsOverviewQuery } from '@/features/analytics/api/analyticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function TopProductsList() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
        <h3 className="text-[15px] font-bold text-slate-900 mb-4">Top products</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const topSellingProducts = data?.topSellingProducts || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-slate-900">Top products</h3>
        {topSellingProducts.length > 0 && (
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 group"
          >
            View products
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {topSellingProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-900 mb-1">No sales data</p>
          <p className="text-xs text-slate-500">Products will appear here once sold.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 pb-2 border-b border-slate-100">
            <span>Product</span>
            <span>Revenue</span>
          </div>
          <ul className="space-y-3">
            {topSellingProducts.slice(0, 5).map((prod) => (
              <li key={prod.productId} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate" title={prod.title || prod.productTitle}>
                    {prod.title || prod.productTitle}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[13px] font-bold text-slate-900">
                    ৳{prod.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
