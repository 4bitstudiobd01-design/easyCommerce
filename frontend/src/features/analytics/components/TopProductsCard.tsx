'use client';

import React from 'react';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { Trophy, Package, ArrowUpRight, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export function TopProductsCard() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const topSellingProducts = data?.topSellingProducts || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Top Selling Products</h3>
            <p className="text-[11px] text-slate-400">Best performing catalog items</p>
          </div>
        </div>
      </div>

      {topSellingProducts.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-semibold">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <span>No sales recorded yet.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {topSellingProducts.map((prod, idx) => (
            <div
              key={prod.productId}
              className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-100/80"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center ${
                    idx === 0
                      ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/20'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-900'
                      : 'bg-amber-700/20 text-amber-900'
                  }`}
                >
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{prod.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {prod.totalQuantity} units sold
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-xs text-blue-600 block">
                  ৳{prod.totalRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Total Sales</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
