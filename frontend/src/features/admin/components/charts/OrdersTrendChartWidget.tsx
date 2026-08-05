'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard } from '../core/ChartCard';
import { ChartWrapper } from './ChartWrapper';

export interface OrdersTrendPoint {
  dayName: string;
  ordersCount: number;
}

export interface OrdersTrendChartWidgetProps {
  data?: OrdersTrendPoint[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultData: OrdersTrendPoint[] = [
  { dayName: 'Mon', ordersCount: 240 },
  { dayName: 'Tue', ordersCount: 310 },
  { dayName: 'Wed', ordersCount: 280 },
  { dayName: 'Thu', ordersCount: 390 },
  { dayName: 'Fri', ordersCount: 450 },
  { dayName: 'Sat', ordersCount: 520 },
  { dayName: 'Sun', ordersCount: 480 },
];

export function OrdersTrendChartWidget({
  data = defaultData,
  isLoading = false,
  isError = false,
  error,
  lastUpdated,
  onRefresh,
  className = '',
}: OrdersTrendChartWidgetProps) {
  return (
    <ChartCard
      title="Cross-Tenant Daily Orders Volume"
      subtitle="Total customer orders processed platform-wide"
      icon={ShoppingCart}
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
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="dayName" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              formatter={(value: any) => [`${value || 0} Orders`, 'Order Count']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
            />
            <Bar dataKey="ordersCount" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  );
}
