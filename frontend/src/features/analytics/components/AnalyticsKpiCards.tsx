'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  ShoppingBag,
  Tag,
  Users,
  Target,
  ArrowDownLeft,
} from 'lucide-react';
import { useGetAnalyticsKpiSummaryQuery } from '../api/analyticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

interface KpiCardConfig {
  title: string;
  value: string;
  trend: string | null;
  isPositive: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

const formatCurrency = (value: number) => `৳${value.toLocaleString('en-US')}`;

const percentChange = (current: number, previous: number): string | null => {
  if (!previous) return null;
  const change = ((current - previous) / previous) * 100;
  if (!Number.isFinite(change)) return null;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

export function AnalyticsKpiCards() {
  const { data, isLoading } = useGetAnalyticsKpiSummaryQuery();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-[120px] space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="w-10 h-10 rounded-xl" />
            </div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  const revenueTrend = percentChange(data.totalRevenue, data.previousTotals.totalRevenue);
  const ordersTrend = percentChange(data.totalOrders, data.previousTotals.totalOrders);
  const aovTrend = percentChange(data.averageOrderValue, data.previousTotals.averageOrderValue);

  const kpis: KpiCardConfig[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      trend: revenueTrend,
      isPositive: (revenueTrend ?? '').startsWith('+'),
      icon: <LineChart className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toLocaleString('en-US'),
      trend: ordersTrend,
      isPositive: (ordersTrend ?? '').startsWith('+'),
      icon: <ShoppingBag className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(data.averageOrderValue),
      trend: aovTrend,
      isPositive: (aovTrend ?? '').startsWith('+'),
      icon: <Tag className="w-5 h-5 text-amber-500" />,
      iconBg: 'bg-amber-50',
    },
    {
      title: 'Total Customers',
      value: data.totalCustomers.toLocaleString('en-US'),
      trend: null,
      isPositive: true,
      icon: <Users className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-50',
    },
    {
      title: 'Conversion Rate',
      value: data.conversionRate === null ? '—' : `${data.conversionRate.toFixed(1)}%`,
      trend: null,
      isPositive: true,
      icon: <Target className="w-5 h-5 text-teal-600" />,
      iconBg: 'bg-teal-50',
    },
    {
      title: 'Refunds',
      value: formatCurrency(data.totalRefunded),
      trend: null,
      isPositive: false,
      icon: <ArrowDownLeft className="w-5 h-5 text-red-600" />,
      iconBg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between h-[120px]">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] font-bold text-slate-900 mb-1">{kpi.title}</p>
              <h3 className="text-[22px] font-extrabold text-slate-900 tracking-tight">{kpi.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
              {kpi.icon}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-auto">
            {kpi.trend === null ? (
              <span className="text-[10px] text-slate-400 font-medium">
                {kpi.title === 'Conversion Rate' && data.conversionRate === null
                  ? 'Not enough traffic data yet'
                  : 'vs previous period'}
              </span>
            ) : (
              <>
                {kpi.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                )}
                <span className={`text-[11px] font-bold ${kpi.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kpi.trend}
                </span>
                <span className="text-[10px] text-slate-500 font-medium ml-0.5">vs previous period</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
