'use client';

import React from 'react';
import { Users } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard } from '../core/ChartCard';
import { ChartWrapper } from './ChartWrapper';

export interface MerchantGrowthPoint {
  date: string;
  totalMerchants: number;
}

export interface MerchantGrowthChartWidgetProps {
  data?: MerchantGrowthPoint[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultData: MerchantGrowthPoint[] = [
  { date: 'Week 1', totalMerchants: 1120 },
  { date: 'Week 2', totalMerchants: 1155 },
  { date: 'Week 3', totalMerchants: 1190 },
  { date: 'Week 4', totalMerchants: 1250 },
];

export function MerchantGrowthChartWidget({
  data = defaultData,
  isLoading = false,
  isError = false,
  error,
  lastUpdated,
  onRefresh,
  className = '',
}: MerchantGrowthChartWidgetProps) {
  return (
    <ChartCard
      title="Merchant Onboarding Velocity"
      subtitle="Cumulative SaaS merchant registrations"
      icon={Users}
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
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              formatter={(value: any) => [`${value || 0} Merchants`, 'Total Merchants']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
            />
            <Line type="monotone" dataKey="totalMerchants" stroke="#9333ea" strokeWidth={3} dot={{ r: 5, fill: '#9333ea' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  );
}
