'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, ArrowUp } from 'lucide-react';

const data = [
  { name: 'New Customers', value: 1456, percentage: '51.2%', color: '#2563eb' },
  { name: 'Returning Customers', value: 1390, percentage: '48.8%', color: '#10b981' },
];

export function CustomerOverviewChart() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Customer Overview</h3>
        <button className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors">
          All Time
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row items-center justify-between gap-6">
        
        {/* Left Side Texts */}
        <div className="flex flex-col gap-5 w-full xl:w-auto">
          <div>
            <p className="text-[11px] text-slate-500 font-medium mb-1">Total Customers</p>
            <p className="text-lg font-extrabold text-slate-900">2,846</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium mb-1">New Customers</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">1,456</p>
              <div className="flex items-center text-emerald-600">
                <ArrowUp className="w-3 h-3" />
                <span className="text-[10px] font-bold">18.7%</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium mb-1">Returning Customers</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">1,390</p>
              <div className="flex items-center text-emerald-600">
                <ArrowUp className="w-3 h-3" />
                <span className="text-[10px] font-bold">11.3%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Donut */}
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
                formatter={(value: number) => value.toLocaleString()}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-extrabold text-slate-900">2,846</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Total</span>
          </div>
        </div>

        {/* Right Legend */}
        <div className="flex flex-col gap-4 w-full xl:w-auto">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-20">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-700 leading-tight">{item.name.split(' ')[0]}</span>
                  <span className="text-[9px] text-slate-400">Total</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[11px] font-bold text-slate-900">{item.percentage}</span>
                <span className="text-[10px] text-slate-500">({item.value.toLocaleString()})</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
