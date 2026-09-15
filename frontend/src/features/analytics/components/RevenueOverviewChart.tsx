'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import {
  useAnalyticsOverviewParams,
  useAnalyticsShowComparison,
} from '../context/AnalyticsFiltersContext';
import { Skeleton } from '@/components/ui/Skeleton';

export function RevenueOverviewChart() {
  const dateParams = useAnalyticsOverviewParams();
  const showComparison = useAnalyticsShowComparison();
  const { data, isLoading } = useGetAnalyticsOverviewQuery(dateParams);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
        <Skeleton className="h-5 w-40 mb-6" />
        <Skeleton className="h-full w-full flex-1" />
      </div>
    );
  }

  const current = data?.dailyRevenueTrend || [];
  const previous = data?.previousDailyRevenueTrend || [];
  const chartData = current.map((point, i) => ({
    date: point.dayName,
    current: point.revenue,
    previous: showComparison ? previous[i]?.revenue ?? null : null,
  }));
  const hasData = chartData.some((d) => d.current > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Revenue Overview</h3>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <span className="text-[11px] font-medium text-slate-600">Revenue</span>
        </div>
        {showComparison && (
          <div className="flex items-center gap-2">
            <div className="w-4 border-t-2 border-dashed border-blue-300"></div>
            <span className="text-[11px] font-medium text-slate-600">
              {dateParams.compare === 'previousYear' ? 'Previous Year' : 'Previous Period'}
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex-1 min-h-[220px] flex items-center justify-center">
          <p className="text-slate-500 font-medium text-sm">No sales data available for this period.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => `৳${value >= 1000 ? (value / 1000) + 'K' : value}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#93c5fd"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={0}
                fill="none"
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
