'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { MerchantGrowthDataPoint } from '../types/dashboard.types';

interface MerchantGrowthChartProps {
  data: MerchantGrowthDataPoint[];
  summary: {
    newCount: string;
    newChange: string;
    activeCount: string;
    activeChange: string;
    trialCount: string;
    trialChange: string;
    churnedCount: string;
    churnedChange: string;
  };
}

export function MerchantGrowthChart({ data, summary }: MerchantGrowthChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold text-gray-900">Merchant Growth</h2>
          <InfoTooltip content="Weekly merchant acquisition, retention, and churn rate trends." />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-xs font-medium mb-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shrink-0" />
          <span className="text-gray-600 text-[11px] sm:text-xs">New</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shrink-0" />
          <span className="text-gray-600 text-[11px] sm:text-xs">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shrink-0" />
          <span className="text-gray-600 text-[11px] sm:text-xs">Churned</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-44 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              dy={3}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              domain={[0, 250]}
              ticks={[0, 50, 100, 150, 200, 250]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-900/95 text-white text-xs p-3 rounded-xl shadow-xl backdrop-blur-sm border border-gray-800 space-y-1">
                      <div className="font-bold text-gray-300 border-b border-gray-800 pb-1">
                        Week of {label}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-emerald-400">
                        <span>New:</span>
                        <span className="font-bold">{payload[0]?.value}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-emerald-300">
                        <span>Active:</span>
                        <span className="font-bold">{payload[1]?.value}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-rose-400">
                        <span>Churned:</span>
                        <span className="font-bold">{payload[2]?.value}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="newMerchants" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={14} />
            <Bar dataKey="activeMerchants" fill="#6EE7B7" radius={[4, 4, 0, 0]} maxBarSize={14} />
            <Bar dataKey="churnedMerchants" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-Metrics Footer */}
      <div className="grid grid-cols-4 gap-1 pt-3 border-t border-gray-100 mt-2 text-center">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium block truncate">New</span>
          <div className="flex items-center justify-center gap-0.5 mt-0.5 whitespace-nowrap">
            <span className="text-xs sm:text-sm font-bold text-gray-900">{summary.newCount}</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
              {summary.newChange}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium block truncate">Active</span>
          <div className="flex items-center justify-center gap-0.5 mt-0.5 whitespace-nowrap">
            <span className="text-xs sm:text-sm font-bold text-gray-900">{summary.activeCount}</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
              {summary.activeChange}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium block truncate">Trial</span>
          <div className="flex items-center justify-center gap-0.5 mt-0.5 whitespace-nowrap">
            <span className="text-xs sm:text-sm font-bold text-gray-900">{summary.trialCount}</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
              {summary.trialChange}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium block truncate">Churned</span>
          <div className="flex items-center justify-center gap-0.5 mt-0.5 whitespace-nowrap">
            <span className="text-xs sm:text-sm font-bold text-gray-900">{summary.churnedCount}</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-rose-500 flex items-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
              {summary.churnedChange}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
