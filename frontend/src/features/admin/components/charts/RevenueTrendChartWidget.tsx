'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard } from '../core/ChartCard';
import { ChartWrapper } from './ChartWrapper';

export interface RevenueTrendPoint {
  date: string;
  revenueBdt: number;
}

export interface RevenueTrendChartWidgetProps {
  data?: RevenueTrendPoint[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultData: RevenueTrendPoint[] = [
  { date: 'Mon', revenueBdt: 120000 },
  { date: 'Tue', revenueBdt: 185000 },
  { date: 'Wed', revenueBdt: 140000 },
  { date: 'Thu', revenueBdt: 210000 },
  { date: 'Fri', revenueBdt: 290000 },
  { date: 'Sat', revenueBdt: 340000 },
  { date: 'Sun', revenueBdt: 310000 },
];

export function RevenueTrendChartWidget({
  data = defaultData,
  isLoading = false,
  isError = false,
  error,
  lastUpdated,
  onRefresh,
  className = '',
}: RevenueTrendChartWidgetProps) {
  return (
    <ChartCard
      title="Platform Revenue Growth Trend"
      subtitle="Gross merchandise volume across all tenant stores"
      icon={TrendingUp}
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={!data || data.length === 0}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      className={className}
    >
      <ChartWrapper heightPx={260}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              formatter={(value: any) => [`৳${(value || 0).toLocaleString()} BDT`, 'Revenue']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
            />
            <Area type="monotone" dataKey="revenueBdt" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  );
}
