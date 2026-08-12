'use client';

import React from 'react';
import Link from 'next/link';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export function RevenueChart() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
        <h3 className="text-[15px] font-bold text-slate-900 mb-6">Sales overview</h3>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const {
    averageOrderValue = 0,
    dailyRevenueTrend = [],
    totalSales = 0,
  } = data || {};

  const hasData = dailyRevenueTrend.length > 0 && totalSales > 0;
  const maxRevenue = hasData ? Math.max(...dailyRevenueTrend.map((d) => d.revenue), 100) : 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">Sales overview</h3>
        </div>

        {hasData && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block leading-tight">
                Avg. Order Value
              </span>
              <span className="text-[13px] font-bold text-slate-900 leading-none mt-0.5 block">
                ৳{averageOrderValue.toLocaleString()}
              </span>
            </div>
            {/* Optional time range controls placeholder */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-slate-900 shadow-sm border border-slate-200/50">7D</button>
              <button className="px-2.5 py-1 text-[11px] font-semibold rounded-md text-slate-500 hover:text-slate-900 transition-colors">30D</button>
            </div>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">No sales data yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Your sales performance will appear here once you receive your first order.
          </p>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
          >
            View Store
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end mt-2 min-h-[160px]">
          <div className="flex items-end justify-between gap-1.5 sm:gap-3 px-1 h-full">
            {dailyRevenueTrend.map((point) => {
              const heightPercent = Math.max(8, Math.round((point.revenue / maxRevenue) * 100));

              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-medium py-1.5 px-2.5 rounded-lg shadow-lg pointer-events-none mb-1 text-center whitespace-nowrap z-10 absolute -mt-10">
                    <span className="font-bold">৳{point.revenue.toLocaleString()}</span>
                    <span className="text-slate-300 ml-1">({point.ordersCount} orders)</span>
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[40px] bg-slate-100 rounded-t-sm overflow-hidden flex flex-col justify-end h-full relative">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 group-hover:bg-blue-600"
                    ></div>
                  </div>

                  {/* Day Label */}
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                    {point.dayName || point.date.split('-').pop()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
