'use client';

import React, { useState } from 'react';
import {
  useGetCustomerAnalyticsOverviewQuery,
  useGetCustomerAnalyticsSourcesQuery,
  useGetCustomerAnalyticsTrendQuery,
  useGetTopCustomersQuery,
} from '../api/customerApi';
import {
  Users,
  UserPlus,
  UserCheck,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Award,
  Calendar,
  Globe,
  Store,
  Monitor,
  UploadCloud,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface CustomerAnalyticsViewProps {
  onSelectCustomer: (customerId: string) => void;
}

export function CustomerAnalyticsView({ onSelectCustomer }: CustomerAnalyticsViewProps) {
  const [dateRange, setDateRange] = useState('30');

  const { data: overview, isLoading: isOverviewLoading } = useGetCustomerAnalyticsOverviewQuery({ dateRange });
  const { data: sources = [], isLoading: isSourcesLoading } = useGetCustomerAnalyticsSourcesQuery();
  const { data: trendData = [], isLoading: isTrendLoading } = useGetCustomerAnalyticsTrendQuery({ dateRange });
  const { data: topCustomers = [], isLoading: isTopLoading } = useGetTopCustomersQuery(10);

  const getOriginDisplayName = (origin: string) => {
    const map: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      google: 'Google',
      youtube: 'YouTube',
      direct: 'Direct Traffic',
      organic_search: 'Organic Search',
      paid_search: 'Paid Search',
      social: 'Social Media',
      referral: 'Referral',
      email: 'Email Campaign',
      online_store: 'Online Store',
    };
    return map[origin.toLowerCase()] || origin.replace(/_/g, ' ');
  };

  const getOriginIcon = (originName: string) => {
    const key = originName.toLowerCase();
    if (key.includes('facebook') || key.includes('instagram') || key.includes('social') || key.includes('tiktok')) {
      return <Sparkles className="w-4 h-4 text-blue-600" />;
    }
    if (key.includes('google') || key.includes('search') || key.includes('youtube')) {
      return <Globe className="w-4 h-4 text-emerald-600" />;
    }
    if (key.includes('direct')) {
      return <Monitor className="w-4 h-4 text-amber-600" />;
    }
    return <Globe className="w-4 h-4 text-indigo-600" />;
  };

  const formatCurrency = (val?: number) => {
    return `৳${(val || 0).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="font-extrabold text-sm text-slate-900">Customer Performance & Growth Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time revenue, acquisition, and customer metrics</p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            aria-label="Select Date Range"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
            <option value="ALL">All Time</option>
          </select>
        </div>
      </div>

      {/* 1. Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          {isOverviewLoading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <p className="text-2xl font-black text-slate-900">{overview?.totalCustomers || 0}</p>
          )}
          <p className="text-[11px] text-slate-400">All registered profiles</p>
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Signups</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          {isOverviewLoading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <p className="text-2xl font-black text-emerald-700">{overview?.newCustomers || 0}</p>
          )}
          <p className="text-[11px] text-slate-400">Created in selected period</p>
        </div>

        {/* Repeat Customers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repeat Buyers</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          {isOverviewLoading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <p className="text-2xl font-black text-indigo-700">{overview?.repeatCustomers || 0}</p>
          )}
          <p className="text-[11px] text-slate-400">&gt; 1 completed orders</p>
        </div>

        {/* Customer LTV */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average LTV</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          {isOverviewLoading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <p className="text-2xl font-black text-slate-900">{formatCurrency(overview?.avgCustomerLtv)}</p>
          )}
          <p className="text-[11px] text-slate-400">Avg revenue per customer</p>
        </div>
      </div>

      {/* 2. Trend Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Growth Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Customer Revenue & Acquisition Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily breakdown for selected date range</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-slate-600">Revenue (BDT)</span>
              </div>
            </div>
          </div>

          {isTrendLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : trendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-semibold">
              No trend data available for this timeframe.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `৳${val}`} />
                  <Tooltip
                    formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Origin Distribution Breakdown (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Marketing Origin & Channels</h3>
            <p className="text-xs text-slate-500 mt-0.5">Customer acquisition by marketing traffic origin</p>
          </div>

          {isSourcesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : sources.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No origin data available.</p>
          ) : (
            <div className="space-y-4">
              {sources.map((item) => (
                <div key={item.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getOriginIcon(item.source)}
                      <span className="font-bold text-slate-800">{getOriginDisplayName(item.source)}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Derived from first-touch marketing attribution & UTM parameters
          </div>
        </div>
      </div>

      {/* 3. Top Customers Ranking Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-900">Top 10 Customers by Spend</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Ranked by valid historical order revenue</span>
        </div>

        {isTopLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : topCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No customer order transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Avg Order Value</th>
                  <th className="py-3 px-4">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {topCustomers.map((cust, idx) => (
                  <tr
                    key={cust.id}
                    onClick={() => onSelectCustomer(cust.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-black text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block hover:text-blue-600 transition-colors">
                        {cust.firstName} {cust.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">{cust.email || 'No email'}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{cust.phone}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-blue-600">{cust.ordersCount}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{formatCurrency(cust.totalSpent)}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{formatCurrency(cust.avgOrderValue)}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {cust.lastOrderAt ? new Date(cust.lastOrderAt).toLocaleDateString('en-US') : 'No orders'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
