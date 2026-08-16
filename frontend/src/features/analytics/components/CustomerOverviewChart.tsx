'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useGetNewVsReturningSummaryQuery } from '../api/analyticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function CustomerOverviewChart() {
  const { data, isLoading } = useGetNewVsReturningSummaryQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
        <Skeleton className="h-5 w-40 mb-6" />
        <Skeleton className="h-40 w-40 rounded-full mx-auto" />
      </div>
    );
  }

  const newCustomers = data?.newCustomers || 0;
  const returningCustomers = data?.returningCustomers || 0;
  const total = newCustomers + returningCustomers;

  const chartData = [
    { name: 'New Customers', value: newCustomers, percentage: `${(data?.newPercentage ?? 0).toFixed(1)}%`, color: '#2563eb' },
    { name: 'Returning Customers', value: returningCustomers, percentage: `${(data?.returningPercentage ?? 0).toFixed(1)}%`, color: '#10b981' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Customer Overview</h3>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 font-medium text-xs">No customers with orders in this period yet.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-5 w-full xl:w-auto">
            <div>
              <p className="text-[11px] text-slate-500 font-medium mb-1">Total Customers</p>
              <p className="text-lg font-extrabold text-slate-900">{total.toLocaleString('en-US')}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium mb-1">New Customers</p>
              <p className="text-sm font-bold text-slate-900">{newCustomers.toLocaleString('en-US')}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium mb-1">Returning Customers</p>
              <p className="text-sm font-bold text-slate-900">{returningCustomers.toLocaleString('en-US')}</p>
            </div>
          </div>

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
                  formatter={(value) => Number(value).toLocaleString()}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-extrabold text-slate-900">{total.toLocaleString('en-US')}</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Total</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full xl:w-auto">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-20">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] font-medium text-slate-700 leading-tight">{item.name.split(' ')[0]}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[11px] font-bold text-slate-900">{item.percentage}</span>
                  <span className="text-[10px] text-slate-500">({item.value.toLocaleString()})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
