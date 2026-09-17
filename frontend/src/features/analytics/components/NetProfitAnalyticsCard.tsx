'use client';

import React from 'react';
import { useGetNetProfitQuery } from '../api/analyticsApi';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  BarChart3,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export function NetProfitAnalyticsCard() {
  const { data, isLoading, refetch } = useGetNetProfitQuery();

  const profitColor =
    !data || data.netProfit >= 0
      ? 'text-emerald-700'
      : 'text-red-600';

  const profitBg =
    !data || data.netProfit >= 0
      ? 'bg-emerald-50 border-emerald-200'
      : 'bg-red-50 border-red-200';

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="h-8 w-56 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Gross Revenue',
      value: data?.grossRevenue ?? 0,
      icon: <DollarSign className="w-4 h-4 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
      valueColor: 'text-blue-900',
      description: 'Total revenue from all completed orders',
    },
    {
      label: 'Total Product Cost',
      value: data?.totalProductCost ?? 0,
      icon: <Package className="w-4 h-4 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      valueColor: 'text-amber-900',
      description: 'Sum of cost prices for all sold items',
    },
    {
      label: 'Total Delivery Fees',
      value: data?.totalDeliveryFees ?? 0,
      icon: <Truck className="w-4 h-4 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
      valueColor: 'text-purple-900',
      description: 'Shipping & courier charges collected',
    },
    {
      label: 'Net Profit',
      value: data?.netProfit ?? 0,
      icon: data && data.netProfit >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />,
      bg: profitBg,
      valueColor: profitColor,
      description: 'Revenue minus all product costs',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Net Profit & Financial Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time breakdown of gross revenue, product costs, and net profit margin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-sm"
          title="Refresh Metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* PROFIT MARGIN HIGHLIGHT */}
      <div className={`rounded-2xl border p-5 flex items-center justify-between ${profitBg}`}>
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Overall Profit Margin</p>
          <p className={`text-4xl font-black mt-1 ${profitColor}`}>
            {data?.profitMarginPercentage ?? 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Based on {data?.totalCompletedOrdersCount ?? 0} completed orders
          </p>
        </div>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${data && data.netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
          <BarChart3 className={`w-8 h-8 ${data && data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border p-5 ${metric.bg} space-y-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">{metric.label}</span>
              <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
                {metric.icon}
              </div>
            </div>

            <div>
              <p className={`text-2xl font-black ${metric.valueColor}`}>
                ৳{Number(metric.value).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{metric.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MISSING COST PRICE WARNING */}
      {data && data.itemsMissingCostPriceCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-900 text-xs">
              {data.productsMissingCostPriceCount} product(s) are missing a cost price
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {data.itemsMissingCostPriceCount} sold unit(s) across these products were excluded
              from Total Product Cost and Net Profit — no cost price means no accurate cost, so
              they are left out rather than estimated. Gross Revenue still includes them. Set a
              cost price on each product for a complete, accurate Net Profit figure.
            </p>
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-amber-800 hover:text-amber-900 underline"
            >
              Go to Products →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
