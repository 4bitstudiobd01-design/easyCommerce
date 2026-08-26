'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TRANSACTION_DONUT_DATA } from './transactionsMockData';
import { toast } from 'sonner';

export function TransactionOverviewDonutCard() {
  const data = TRANSACTION_DONUT_DATA;
  const total = 8456;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header with View Report link */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
          Transaction Overview
        </h3>
        <button
          type="button"
          onClick={() => toast.info('Opening detailed transaction report')}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
        >
          View Report
        </button>
      </div>

      {/* Donut Chart with Centered Total */}
      <div className="relative h-44 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={52}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold text-slate-900 leading-none">
            {total.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5">
            Total Transactions
          </span>
        </div>
      </div>

      {/* Legend List */}
      <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 font-medium">{item.name}</span>
            </div>
            <span className="font-semibold text-slate-800">
              {item.value > 0
                ? `${item.value.toLocaleString()} (${item.percentage})`
                : '- (0%)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
