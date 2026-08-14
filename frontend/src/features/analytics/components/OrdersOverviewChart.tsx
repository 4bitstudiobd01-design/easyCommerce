'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
  { date: 'Aug 8', current: 55, previous: 70 },
  { date: 'Aug 9', current: 45, previous: 60 },
  { date: 'Aug 10', current: 52, previous: 70 },
  { date: 'Aug 11', current: 68, previous: 80 },
  { date: 'Aug 12', current: 60, previous: 80 },
  { date: 'Aug 13', current: 55, previous: 80 },
  { date: 'Aug 14', current: 85, previous: 65 },
];

export function OrdersOverviewChart() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Orders Overview</h3>
        <button className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors">
          Daily
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
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

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={-16}>
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
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}
              cursor={{ fill: '#f8fafc' }}
            />
            {/* Previous Period Bar - drawn first so it sits behind or as a bounding box */}
            <Bar 
              dataKey="previous" 
              fill="transparent" 
              stroke="#60a5fa" 
              strokeWidth={1}
              strokeDasharray="4 4"
              barSize={16}
              radius={[2, 2, 0, 0]}
            />
            {/* Current Period Bar */}
            <Bar 
              dataKey="current" 
              fill="#2563eb" 
              barSize={16}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
