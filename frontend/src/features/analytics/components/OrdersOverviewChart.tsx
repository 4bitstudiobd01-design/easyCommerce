'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function OrdersOverviewChart() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

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
    current: point.ordersCount,
    previous: previous[i]?.ordersCount ?? null,
  }));
  const maxCount = Math.max(1, ...chartData.map((d) => Math.max(d.current, d.previous ?? 0)));
  const hasData = chartData.some((d) => d.current > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Orders Overview</h3>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <span className="text-[11px] font-medium text-slate-600">Orders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 border-t-2 border-dashed border-blue-400"></div>
          <span className="text-[11px] font-medium text-slate-600">Previous Period</span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 min-h-[220px] flex items-center justify-center">
          <p className="text-slate-500 font-medium text-sm">No orders recorded for this period.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={-16}>
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
                allowDecimals={false}
                domain={[0, maxCount]}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar
                dataKey="previous"
                fill="transparent"
                stroke="#60a5fa"
                strokeWidth={1}
                strokeDasharray="4 4"
                barSize={16}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="current"
                fill="#2563eb"
                barSize={16}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
