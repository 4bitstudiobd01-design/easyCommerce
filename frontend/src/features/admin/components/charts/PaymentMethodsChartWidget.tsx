'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
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

export interface PaymentGatewayPoint {
  name: string;
  value: number;
  color: string;
}

export interface PaymentMethodsChartWidgetProps {
  data?: PaymentGatewayPoint[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultData: PaymentGatewayPoint[] = [
  { name: 'Cash on Delivery (COD)', value: 58, color: '#10b981' },
  { name: 'SSLCommerz (Cards/NetBanking)', value: 24, color: '#2563eb' },
  { name: 'bKash Direct Gateway', value: 12, color: '#ec4899' },
  { name: 'Nagad Direct Gateway', value: 6, color: '#f97316' },
];

export function PaymentMethodsChartWidget({
  data = defaultData,
  isLoading = false,
  isError = false,
  error,
  lastUpdated,
  onRefresh,
  className = '',
}: PaymentMethodsChartWidgetProps) {
  return (
    <ChartCard
      title="Payment Gateway Share & Distribution"
      subtitle="Percentage ratio of checkout payment methods"
      icon={CreditCard}
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
              formatter={(value: any) => [`${value || 0}% of transactions`, 'Share']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  );
}
