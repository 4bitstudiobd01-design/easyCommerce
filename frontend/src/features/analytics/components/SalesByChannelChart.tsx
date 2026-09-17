'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { useAnalyticsOverviewParams } from '../context/AnalyticsFiltersContext';
import { Skeleton } from '@/components/ui/Skeleton';

const CHANNEL_COLORS: Record<string, string> = {
  direct: '#2563eb',
  organic_search: '#f59e0b',
  paid_search: '#0ea5e9',
  social: '#10b981',
  referral: '#ef4444',
  email: '#8b5cf6',
  other: '#94a3b8',
};

const CHANNEL_LABELS: Record<string, string> = {
  direct: 'Direct',
  organic_search: 'Organic Search',
  paid_search: 'Paid Search',
  social: 'Social Media',
  referral: 'Referral',
  email: 'Email',
  other: 'Other',
};

export function SalesByChannelChart() {
  const dateParams = useAnalyticsOverviewParams();
  const { data, isLoading } = useGetAnalyticsOverviewQuery(dateParams);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
        <Skeleton className="h-5 w-40 mb-6" />
        <Skeleton className="h-40 w-40 rounded-full mx-auto" />
      </div>
    );
  }

  const channelBreakdown = data?.channelBreakdown || [];
  const total = channelBreakdown.reduce((sum, c) => sum + c.revenue, 0);
  const chartData = channelBreakdown.map((c) => ({
    name: CHANNEL_LABELS[c.channel] || c.channel,
    value: c.revenue,
    percentage: total > 0 ? `${((c.revenue / total) * 100).toFixed(1)}%` : '0%',
    color: CHANNEL_COLORS[c.channel] || CHANNEL_COLORS.other,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Sales by Channel</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <BarChart3 className="w-6 h-6 text-slate-300" />
          <p className="text-slate-500 font-medium text-xs">No channel data yet</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-6">
          <div className="relative w-40 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `৳${Number(value).toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-extrabold text-slate-900">৳{total.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Total</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[180px]">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[11px] font-medium text-slate-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-900">৳{item.value.toLocaleString()}</span> ({item.percentage})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
