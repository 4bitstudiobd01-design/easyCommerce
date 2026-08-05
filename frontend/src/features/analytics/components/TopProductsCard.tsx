'use client';

import React from 'react';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { Trophy, Package, ArrowUpRight, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export function TopProductsCard() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const topSellingProducts = data?.topSellingProducts || [];

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] h-full">
      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 leading-tight">Top Selling Products</h3>
            <p className="text-[11px] text-slate-500 leading-tight">Best performing catalog items</p>
          </div>
        </div>
      </div>

      {topSellingProducts.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-[11px] font-semibold">
          <Package className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
          <span>No sales recorded yet.</span>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {topSellingProducts.slice(0, 3).map((prod, idx) => (
            <div
              key={prod.productId}
              className="p-2.5 bg-slate-50/50 border border-slate-50 rounded-xl flex items-center justify-between transition-all hover:bg-slate-100/50"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-lg font-extrabold text-[11px] flex items-center justify-center ${
                    idx === 0
                      ? 'bg-slate-500 text-white shadow-sm shadow-slate-500/20'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-900'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1 leading-tight">{prod.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    {prod.totalQuantity} units sold
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-xs text-slate-600 block leading-tight">
                  ৳{prod.totalRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">Total Sales</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
