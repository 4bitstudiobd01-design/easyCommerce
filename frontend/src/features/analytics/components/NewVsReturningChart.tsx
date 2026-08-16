'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGetNewVsReturningTrendQuery } from '../api/analyticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function NewVsReturningChart() {
  const { data, isLoading } = useGetNewVsReturningTrendQuery({ days: 7 });

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
        <Skeleton className="h-5 w-52 mb-6" />
        <Skeleton className="h-full w-full flex-1" />
      </div>
    );
  }

  const points = data || [];
  const chartData = points.map((p) => ({
    date: new Date(`${p.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    new: p.newCustomers,
    returning: p.returningCustomers,
  }));
  const maxCount = Math.max(1, ...chartData.map((d) => d.new + d.returning));
  const hasData = chartData.some((d) => d.new + d.returning > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">New vs Returning Customers</h3>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <span className="text-[11px] font-medium text-slate-600">New Customers</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="text-[11px] font-medium text-slate-600">Returning Customers</span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 min-h-[220px] flex items-center justify-center">
          <p className="text-slate-500 font-medium text-sm">No orders in the last 7 days.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Bar dataKey="new" stackId="a" fill="#2563eb" barSize={16} />
              <Bar dataKey="returning" stackId="a" fill="#10b981" barSize={16} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
