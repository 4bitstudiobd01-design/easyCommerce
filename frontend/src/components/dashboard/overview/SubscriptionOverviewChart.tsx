'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { SubscriptionBreakdown } from '../types/dashboard.types';

interface SubscriptionOverviewChartProps {
  breakdown: SubscriptionBreakdown[];
  summary: {
    total: string;
    activeSubscriptions: string;
    activeChange: string;
    trialSubscriptions: string;
    trialChange: string;
    conversionRate: string;
    conversionChange: string;
    churnRate: string;
    churnChange: string;
  };
}

export function SubscriptionOverviewChart({
  breakdown,
  summary,
}: SubscriptionOverviewChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold text-gray-900">Subscription Overview</h2>
          <InfoTooltip content="Active tier breakdown, plan conversions, and merchant subscriptions." />
        </div>
      </div>

      {/* Donut Chart & Legend in Row */}
      <div className="flex items-center justify-between gap-3 h-44 my-auto min-w-0">
        {/* Donut with Center Text */}
        <div className="relative w-[48%] h-full flex items-center justify-center shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={2}
                dataKey="count"
              >
                {breakdown.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as SubscriptionBreakdown;
                    return (
                      <div className="bg-gray-900/95 text-white text-xs p-2.5 rounded-xl shadow-xl border border-gray-800">
                        <div className="font-bold">{item.name} Plan</div>
                        <div className="text-gray-300">
                          {item.count.toLocaleString()} merchants ({item.percentage}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Absolute Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
              {summary.total}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">Total Subscriptions</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-[52%] space-y-1.5 text-xs min-w-0">
          {breakdown.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 font-medium text-[11px] sm:text-xs truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-gray-500 font-semibold text-[10px] sm:text-[11px] shrink-0">
                {item.count.toLocaleString()} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-Metrics Footer */}
      <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-gray-100 mt-2 text-center">
        <div className="min-w-0">
          <span className="text-[10px] text-gray-500 font-medium block truncate" title="Active Subscriptions">
            Active
          </span>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            <span className="text-xs font-bold text-gray-900">{summary.activeSubscriptions}</span>
            <span className="text-[9px] font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
              {summary.activeChange}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] text-gray-500 font-medium block truncate" title="Trial Subscriptions">
            Trial
          </span>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            <span className="text-xs font-bold text-gray-900">{summary.trialSubscriptions}</span>
            <span className="text-[9px] font-semibold text-rose-500 flex items-center">
              <ArrowDownRight className="w-2.5 h-2.5" />
              {summary.trialChange}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] text-gray-500 font-medium block truncate" title="Conversion Rate">
            Conversion
          </span>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            <span className="text-xs font-bold text-gray-900">{summary.conversionRate}</span>
            <span className="text-[9px] font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
              {summary.conversionChange}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] text-gray-500 font-medium block truncate" title="Churn Rate">
            Churn
          </span>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            <span className="text-xs font-bold text-gray-900">{summary.churnRate}</span>
            <span className="text-[9px] font-semibold text-rose-500 flex items-center">
              <ArrowDownRight className="w-2.5 h-2.5" />
              {summary.churnChange}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
