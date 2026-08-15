'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TrendPoint } from '../utils/abandonedCartMetrics';

interface AbandonmentTrendCardProps {
  trend: TrendPoint[];
  isLoading: boolean;
}

export const AbandonmentTrendCard = ({ trend, isLoading }: AbandonmentTrendCardProps) => {
  const hasData = trend.some((point) => point.count > 0);

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xs font-extrabold text-slate-900">Abandonment Trend</h2>
        <span className="text-[10px] font-bold text-slate-400">Last 7 days</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : !hasData ? (
        <div className="h-32 flex items-center justify-center text-center px-4">
          <p className="text-[11px] font-medium text-slate-400">
            No carts abandoned in the last 7 days.
          </p>
        </div>
      ) : (
        <div className="h-32 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="abandonmentTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                width={24}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ stroke: '#059669', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '6px 10px',
                }}
                labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                formatter={(value) => [Number(value) || 0, 'Carts']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#abandonmentTrendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
