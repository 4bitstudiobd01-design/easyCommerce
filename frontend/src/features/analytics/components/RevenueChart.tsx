'use client';

import React from 'react';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { TrendingUp, DollarSign, CreditCard, Truck, Calendar, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export function RevenueChart() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-56 w-full rounded-2xl" />
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
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Financial Performance Curve</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">7-Day Revenue & Sales Trend</h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Average Order Value (AOV)
            </span>
            <span className="text-base font-extrabold text-slate-900">৳{averageOrderValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="space-y-2">
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
          {dailyRevenueTrend.map((point) => {
            const heightPercent = Math.max(12, Math.round((point.revenue / maxRevenue) * 100));

            return (
              <div key={point.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg pointer-events-none mb-1 text-center whitespace-nowrap">
                  ৳{point.revenue.toLocaleString()} ({point.ordersCount} orders)
                </div>

                {/* Vertical Bar */}
                <div className="w-full bg-slate-100 rounded-2xl overflow-hidden flex flex-col justify-end h-full relative">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-2xl transition-all duration-500 group-hover:from-blue-700 group-hover:to-indigo-600 shadow-md shadow-blue-600/20"
                  ></div>
                </div>

                {/* Day Label */}
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                  {point.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Channel Breakdown */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Payment Gateway Ratio</span>
          <span className="text-slate-400">COD ({paymentMethodStats.codPercent}%) • SSLCommerz ({paymentMethodStats.sslCommerzPercent}%)</span>
        </div>

        {/* Progress Bar Ratio */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${paymentMethodStats.codPercent}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`COD: ${paymentMethodStats.codCount} orders`}
          ></div>
          <div
            style={{ width: `${paymentMethodStats.sslCommerzPercent}%` }}
            className="bg-blue-600 h-full transition-all duration-500"
            title={`SSLCommerz: ${paymentMethodStats.sslCommerzCount} orders`}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Cash on Delivery ({paymentMethodStats.codCount} orders)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Online SSLCommerz / Mobile Banking ({paymentMethodStats.sslCommerzCount} orders)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
