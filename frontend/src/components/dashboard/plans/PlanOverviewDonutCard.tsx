'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PLAN_DONUT_DATA } from './plansMockData';

export function PlanOverviewDonutCard() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
      <h3 className="text-sm font-bold text-slate-900 mb-3">
        Plan Overview
      </h3>

      <div className="flex items-center justify-between gap-3 sm:gap-5">
        {/* Donut Chart with Center Metric */}
        <div className="relative w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PLAN_DONUT_DATA}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={54}
                paddingAngle={2}
                dataKey="value"
              >
                {PLAN_DONUT_DATA.map((entry, index) => (
                  <Cell key={`cell-plan-overview-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none leading-none">
            <span className="text-sm font-bold text-slate-900">2,584</span>
            <span className="text-[9px] text-slate-400 font-medium mt-0.5">
              Total Merchants
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-1.5 text-[11px] min-w-0">
          {PLAN_DONUT_DATA.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-1.5"
            >
              <span className="flex items-center gap-1.5 truncate text-slate-700 font-medium">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-semibold text-slate-900 shrink-0 tabular-nums text-[10px]">
                {item.value.toLocaleString()} ({item.percentage})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
