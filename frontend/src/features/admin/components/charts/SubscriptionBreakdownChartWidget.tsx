'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from '../core/ChartCard';
import { ChartWrapper } from './ChartWrapper';

export interface PlanDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface SubscriptionBreakdownChartWidgetProps {
  data?: PlanDistributionPoint[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultData: PlanDistributionPoint[] = [
  { name: 'Free Trial', value: 350, color: '#94a3b8' },
  { name: 'Starter Plan (৳990)', value: 580, color: '#3b82f6' },
  { name: 'Growth Plan (৳2,490)', value: 290, color: '#10b981' },
  { name: 'Enterprise (Custom)', value: 30, color: '#8b5cf6' },
];

export function SubscriptionBreakdownChartWidget({
  data = defaultData,
  isLoading = false,
  isError = false,
  error,
  lastUpdated,
  onRefresh,
  className = '',
}: SubscriptionBreakdownChartWidgetProps) {
  return (
    <ChartCard
      title="SaaS Subscription Plan Distribution"
      subtitle="Breakdown of merchant subscription Tiers"
      icon={Layers}
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
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${value || 0} Merchants`, 'Count']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  );
}
