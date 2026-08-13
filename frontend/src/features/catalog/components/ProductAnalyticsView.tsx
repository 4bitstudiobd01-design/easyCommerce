'use client';

import React, { useState } from 'react';
import {
  DateRangePreset,
  useGetProductAnalyticsSummaryQuery,
  useGetProductAnalyticsTrendQuery,
  useGetProductAnalyticsVariantsQuery,
} from '@/features/catalog/api/catalogApi';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Layers,
  Calendar,
  AlertCircle,
  RefreshCw,
  Loader2,
  Eye,
  Info,
} from 'lucide-react';

interface ProductAnalyticsViewProps {
  productId: string;
  currencySymbol?: string;
}

export function ProductAnalyticsView({ productId, currencySymbol = '৳' }: ProductAnalyticsViewProps) {
  const [preset, setPreset] = useState<DateRangePreset>('LAST_30_DAYS');

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetProductAnalyticsSummaryQuery({ id: productId, preset });

  const {
    data: trendData = [],
    isLoading: isTrendLoading,
    refetch: refetchTrend,
  } = useGetProductAnalyticsTrendQuery({ id: productId, preset });

  const {
    data: variantData = [],
    isLoading: isVariantLoading,
    refetch: refetchVariants,
  } = useGetProductAnalyticsVariantsQuery({ id: productId, preset });

  const handleRefresh = () => {
    refetchSummary();
    refetchTrend();
    refetchVariants();
  };

  const maxDailyRevenue = Math.max(...trendData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header Controls & Preset Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-extrabold text-slate-900">Product Analytics & Performance</h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Preset Buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'LAST_7_DAYS', label: '7 Days' },
              { id: 'LAST_30_DAYS', label: '30 Days' },
              { id: 'LAST_90_DAYS', label: '90 Days' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreset(item.id as DateRangePreset)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  preset === item.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors shrink-0"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue KPI Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Sales Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          {isSummaryLoading ? (
            <div className="h-8 w-28 bg-slate-100 animate-pulse rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {currencySymbol}{(summary?.revenue.value || 0).toLocaleString()}
              </div>

              <div className="flex items-center gap-1 text-xs font-bold">
                {(summary?.revenue.changePercentage || 0) >= 0 ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{summary?.revenue.changePercentage}%
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {summary?.revenue.changePercentage}%
                  </span>
                )}
                <span className="text-slate-400 font-medium text-[11px]">vs prior period</span>
              </div>
            </>
          )}
        </div>

        {/* Orders Count KPI Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Qualifying Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          {isSummaryLoading ? (
            <div className="h-8 w-28 bg-slate-100 animate-pulse rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {(summary?.ordersCount.value || 0).toLocaleString()}
              </div>

              <div className="flex items-center gap-1 text-xs font-bold">
                {(summary?.ordersCount.changePercentage || 0) >= 0 ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{summary?.ordersCount.changePercentage}%
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {summary?.ordersCount.changePercentage}%
                  </span>
                )}
                <span className="text-slate-400 font-medium text-[11px]">vs prior period</span>
              </div>
            </>
          )}
        </div>

        {/* Units Sold KPI Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Units Sold</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>

          {isSummaryLoading ? (
            <div className="h-8 w-28 bg-slate-100 animate-pulse rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {(summary?.unitsSold.value || 0).toLocaleString()}
              </div>

              <div className="flex items-center gap-1 text-xs font-bold">
                {(summary?.unitsSold.changePercentage || 0) >= 0 ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{summary?.unitsSold.changePercentage}%
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {summary?.unitsSold.changePercentage}%
                  </span>
                )}
                <span className="text-slate-400 font-medium text-[11px]">vs prior period</span>
              </div>
            </>
          )}
        </div>

        {/* AOV KPI Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          {isSummaryLoading ? (
            <div className="h-8 w-28 bg-slate-100 animate-pulse rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {currencySymbol}{(summary?.averageOrderValue.value || 0).toLocaleString()}
              </div>

              <div className="flex items-center gap-1 text-xs font-bold">
                {(summary?.averageOrderValue.changePercentage || 0) >= 0 ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{summary?.averageOrderValue.changePercentage}%
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {summary?.averageOrderValue.changePercentage}%
                  </span>
                )}
                <span className="text-slate-400 font-medium text-[11px]">vs prior period</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Daily Sales Trend Time-Series Bar Graph */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Daily Sales Velocity Trend</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Authoritative Database Aggregation</span>
        </div>

        {isTrendLoading ? (
          <div className="h-48 bg-slate-100 animate-pulse rounded-xl" />
        ) : trendData.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-extrabold text-slate-700">No Sales Recorded for Selected Range</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              There are no qualifying completed or paid orders for this product in the selected time window.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto scrollbar-none border-b border-slate-100">
              {trendData.map((d, index) => {
                const heightPercent = Math.max((d.revenue / maxDailyRevenue) * 100, 4);

                return (
                  <div key={d.date || index} className="flex-1 min-w-[32px] flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                      <div>{d.date}</div>
                      <div>Revenue: {currencySymbol}{d.revenue.toLocaleString()}</div>
                      <div>Orders: {d.orders} | Units: {d.unitsSold}</div>
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-blue-600 group-hover:bg-blue-700 rounded-t-md transition-all shadow-xs"
                    />

                    <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Variant Performance Breakdown */}
      {variantData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Variant Performance Breakdown</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold">{variantData.length} Variants</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Variant Title</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Units Sold</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {variantData.map((v) => (
                  <tr key={v.variantId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-extrabold text-slate-900">{v.variantTitle}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{v.sku || 'N/A'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{v.unitsSold}</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                      {currencySymbol}{v.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Storefront Telemetry Notice */}
      <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-blue-950">Storefront Product View & Conversion Status</h4>
          <p className="text-blue-800/90 leading-relaxed">
            {summary?.viewTrackingNotice || 'Storefront product view tracking is disabled. Conversion rate metrics will be calculated automatically once storefront telemetry events are active.'}
          </p>
        </div>
      </div>
    </div>
  );
}
