'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  REVENUE_CHART_DATA,
  NEW_VS_CANCELLED_DATA,
  STATUS_BREAKDOWN,
  PLAN_BREAKDOWN,
} from './subscriptionMockData';

export function SubscriptionChartsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Subscription Revenue (Line Chart) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-slate-900">
              Subscription Revenue
            </h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                MRR
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                ARR
              </span>
            </div>
          </div>

          <div className="h-44 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="arr"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. New vs Cancelled Subscriptions (Bar Chart) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-slate-900">
              New vs Cancelled Subscriptions
            </h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                New
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Cancelled
              </span>
            </div>
          </div>

          <div className="h-44 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={NEW_VS_CANCELLED_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="newCount" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={10} />
                <Bar dataKey="cancelledCount" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Subscription Status (Donut Chart) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <h3 className="text-[13px] font-bold text-slate-900 mb-2">
          Subscription Status
        </h3>

        <div className="flex items-center justify-between gap-4 sm:gap-6">
          {/* Donut Chart with center label */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={STATUS_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={56}
                  paddingAngle={1.5}
                  dataKey="value"
                >
                  {STATUS_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none leading-none">
              <span className="text-sm sm:text-base font-bold text-slate-900">2,584</span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">Total</span>
            </div>
          </div>

          {/* Right Legend List */}
          <div className="flex-1 space-y-2 text-[11px] min-w-0">
            {STATUS_BREAKDOWN.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate text-slate-700 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-semibold text-slate-900 shrink-0 tabular-nums">
                  {item.percentage === '-'
                    ? '-'
                    : `${item.value.toLocaleString()} (${item.percentage})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Plan Distribution (Donut Chart) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-bold text-slate-900">
            Plan Distribution
          </h3>
          <button
            type="button"
            className="text-[10px] font-semibold text-emerald-600 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            View Report
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 sm:gap-6">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PLAN_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={56}
                  paddingAngle={1.5}
                  dataKey="value"
                >
                  {PLAN_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-plan-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none leading-none">
              <span className="text-sm sm:text-base font-bold text-slate-900">2,588</span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">Total</span>
            </div>
          </div>

          {/* Right Legend List */}
          <div className="flex-1 space-y-2 text-[11px] min-w-0">
            {PLAN_BREAKDOWN.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate text-slate-700 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-semibold text-slate-900 shrink-0 tabular-nums">
                  {item.value.toLocaleString()} ({item.percentage})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
