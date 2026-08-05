'use client';

import React from 'react';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { TrendingUp, DollarSign, CreditCard, Truck, Calendar, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export function RevenueChart() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const {
    totalSales = 0,
    averageOrderValue = 0,
    dailyRevenueTrend = [],
    paymentMethodStats = { codCount: 0, sslCommerzCount: 0, codPercent: 50, sslCommerzPercent: 50 },
  } = data || {};

  const maxRevenue = Math.max(...dailyRevenueTrend.map((d) => d.revenue), 100);

  return (
    <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-bold mb-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Financial Performance Curve</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">7-Day Revenue & Sales Trend</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
              Average Order Value
            </span>
            <span className="text-base font-extrabold text-slate-900 leading-none mt-0.5 block">৳{averageOrderValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="mt-2 flex-1 flex flex-col justify-end">
        <div className="h-48 flex items-end justify-between gap-1.5 sm:gap-2 px-1">
          {dailyRevenueTrend.map((point) => {
            const heightPercent = Math.max(12, Math.round((point.revenue / maxRevenue) * 100));

            return (
              <div key={point.date} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-1.5 rounded shadow-lg pointer-events-none mb-1 text-center whitespace-nowrap z-10 absolute -mt-8">
                  ৳{point.revenue.toLocaleString()} ({point.ordersCount} orders)
                </div>

                {/* Vertical Bar */}
                <div className="w-full bg-slate-100 rounded-lg overflow-hidden flex flex-col justify-end h-full relative">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-slate-400 rounded-lg transition-all duration-500 group-hover:bg-slate-500 shadow-sm"
                  ></div>
                </div>

                {/* Day Label */}
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                  {point.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
