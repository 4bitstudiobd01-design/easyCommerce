'use client';

import React, { useState, useMemo } from 'react';
import { useGetAnalyticsOverviewQuery } from '../api/analyticsApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export function RevenueChart() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();
  const [timeRange, setTimeRange] = useState('30 days');

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full min-h-[400px]">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-full w-full flex-1" />
      </div>
    );
  }

  const {
    dailyRevenueTrend = [],
    totalSales = 0,
    totalRevenue = 0, // Fallback if totalSales is missing
  } = data || {};

  const displayTotal = totalSales || totalRevenue || 0;
  
  // Format dates for X-Axis (e.g., "Jul 16")
  const chartData = dailyRevenueTrend.map(d => {
    const dateObj = new Date(d.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      ...d,
      formattedDate,
      revenue: Number(d.revenue) || 0,
    };
  });

  // Client-side filtering to make tabs functional for demo purposes
  const filteredData = (() => {
    if (chartData.length === 0) return [];
    if (timeRange === '7 days') {
      return chartData.slice(-7);
    }
    // For 30 days, 3 months, 12 months, we just show available data 
    // In a real scenario, this would pass the timeRange to the API
    return chartData; 
  })();

  const hasData = filteredData.length > 0;

  const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return '0';
    if (tickItem >= 1000) {
      return `${(tickItem / 1000).toFixed(0)}K`;
    }
    return tickItem.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-md rounded-lg p-3 min-w-[120px]">
          <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
          <p className="text-base font-bold text-slate-900">
            ৳{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full min-h-[420px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 mb-8">
        
        {/* Left Side: Title & Values */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-800 mb-2">Sales overview</h3>
          <div className="flex items-center gap-3">
            <span className="text-[28px] font-bold text-slate-900 tracking-tight">
              ৳{displayTotal.toLocaleString()}
            </span>
            {hasData && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[13px] font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                18.4%
              </span>
            )}
          </div>
          <span className="text-[13px] text-slate-500 font-medium block mt-1">Total revenue</span>
        </div>

        {/* Right Side: Controls */}
        <div className="flex flex-col items-end gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            {timeRange}
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
          
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            {['7 days', '30 days', '3 months', '12 months'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-[13px] font-semibold rounded-md transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full -ml-4 mt-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                dy={15}
                minTickGap={20}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                tickFormatter={formatYAxis}
                width={65}
                dx={-10}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 5, strokeWidth: 2, fill: '#ffffff', stroke: '#3b82f6' }}
                dot={{ r: 3, strokeWidth: 2, fill: '#ffffff', stroke: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-slate-500 font-medium text-sm">No sales data available for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
