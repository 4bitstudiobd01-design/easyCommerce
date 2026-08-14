'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
  { name: 'Direct', value: 215400, percentage: '44.4%', color: '#2563eb' },
  { name: 'Organic Search', value: 148200, percentage: '30.6%', color: '#f59e0b' },
  { name: 'Social Media', value: 67800, percentage: '14.0%', color: '#10b981' },
  { name: 'Referral', value: 32600, percentage: '6.7%', color: '#ef4444' },
  { name: 'Email', value: 21000, percentage: '4.3%', color: '#8b5cf6' },
];

export function SalesByChannelChart() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Sales by Channel</h3>
        <button className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors">
          All Channels
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-6">
        <div className="relative w-40 h-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `৳${value.toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-extrabold text-slate-900">৳4,85,000</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Total</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[180px]">
          {data.map((item, index) => (
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
    </div>
  );
}
