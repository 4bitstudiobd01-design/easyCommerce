import React from 'react';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { MetricCard } from '../core/MetricCard';

export interface RevenueKpiData {
  totalRevenueBdt: number;
  totalRevenueTrendPercent: number;
  monthlyRevenueBdt: number;
  monthlyRevenueTrendPercent: number;
  revenueGrowthPercent: number;
  currencySymbol?: string;
}

export interface RevenueKpiWidgetProps {
  data?: RevenueKpiData;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

const defaultRevenueData: RevenueKpiData = {
  totalRevenueBdt: 12450000,
  totalRevenueTrendPercent: 18.4,
  monthlyRevenueBdt: 185000,
  monthlyRevenueTrendPercent: 12.2,
  revenueGrowthPercent: 24.5,
  currencySymbol: '৳',
};

export function RevenueKpiWidget({
  data = defaultRevenueData,
  isLoading = false,
  isError = false,
  className = '',
}: RevenueKpiWidgetProps) {
  const symbol = data.currencySymbol || '৳';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${className}`}>
      <MetricCard
        label="Total Platform GMV"
        value={`${symbol}${(data.totalRevenueBdt || 0).toLocaleString()}`}
        unit="BDT"
        trendPercent={data.totalRevenueTrendPercent}
        trendLabel="vs last quarter"
        icon={DollarSign}
        iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
        iconTextColor="text-emerald-600 dark:text-emerald-400"
        isLoading={isLoading}
        isError={isError}
      />

      <MetricCard
        label="Monthly Recurring Revenue (MRR)"
        value={`${symbol}${(data.monthlyRevenueBdt || 0).toLocaleString()}`}
        unit="BDT"
        trendPercent={data.monthlyRevenueTrendPercent}
        trendLabel="vs last month"
        icon={Calendar}
        iconBgColor="bg-blue-50 dark:bg-blue-950/50"
        iconTextColor="text-blue-600 dark:text-blue-400"
        isLoading={isLoading}
        isError={isError}
      />

      <MetricCard
        label="Quarterly Platform Growth"
        value={`${data.revenueGrowthPercent || 0}%`}
        unit="YoY"
        trendPercent={data.revenueGrowthPercent}
        trendLabel="overall expansion"
        icon={TrendingUp}
        iconBgColor="bg-purple-50 dark:bg-purple-950/50"
        iconTextColor="text-purple-600 dark:text-purple-400"
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
