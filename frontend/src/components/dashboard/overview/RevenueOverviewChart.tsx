'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { RevenueDataPoint } from '../types/dashboard.types';

interface RevenueOverviewChartProps {
  data: RevenueDataPoint[];
}

export function RevenueOverviewChart({ data }: RevenueOverviewChartProps) {
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatYAxis = (val: number) => {
    if (val === 0) return '৳0';
    return `৳${(val / 1000).toLocaleString()}k`;
  };

  const ranges = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'This Month'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold text-gray-900">Revenue Overview</h2>
          <InfoTooltip content="Calculated from GMV commission, subscriptions, and platform processing fees." />
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
          >
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                {ranges.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setTimeRange(r);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-emerald-50 hover:text-emerald-700 ${
                      timeRange === r ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs font-medium mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-gray-600">Net Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-gray-600">Subscription Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span className="text-gray-600">Refunds</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="netRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="subRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              dy={5}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={formatYAxis}
              domain={[0, 500000]}
              ticks={[0, 100000, 200000, 300000, 400000, 500000]}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-900/95 text-white text-xs p-3 rounded-xl shadow-xl backdrop-blur-sm border border-gray-800 space-y-1.5">
                      <div className="font-bold text-gray-300 border-b border-gray-800 pb-1">
                        {label}, 2026
                      </div>
                      <div className="flex items-center justify-between gap-4 text-emerald-400">
                        <span>Net Revenue:</span>
                        <span className="font-bold">৳{Number(payload[0]?.value).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-blue-400">
                        <span>Subscription:</span>
                        <span className="font-bold">৳{Number(payload[1]?.value).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-rose-400">
                        <span>Refunds:</span>
                        <span className="font-bold">৳{Number(payload[2]?.value).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Refund line */}
            <Area
              type="monotone"
              dataKey="refunds"
              stroke="#EF4444"
              strokeWidth={2}
              fill="transparent"
              dot={{ r: 3, fill: '#EF4444' }}
              activeDot={{ r: 5 }}
            />

            {/* Subscription line */}
            <Area
              type="monotone"
              dataKey="subscriptionRevenue"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#subRevenueGrad)"
              dot={{ r: 3, fill: '#3B82F6' }}
              activeDot={{ r: 5 }}
            />

            {/* Net Revenue line */}
            <Area
              type="monotone"
              dataKey="netRevenue"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#netRevenueGrad)"
              dot={{ r: 3.5, fill: '#10B981' }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
