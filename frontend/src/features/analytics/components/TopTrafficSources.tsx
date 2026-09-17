'use client';

import React from 'react';
import { Radar } from 'lucide-react';
import { useGetTrafficSourcesQuery } from '../api/analyticsApi';
import { useAnalyticsDateParams } from '../context/AnalyticsFiltersContext';
import { Skeleton } from '@/components/ui/Skeleton';

const CHANNEL_LABELS: Record<string, string> = {
  direct: 'Direct',
  organic_search: 'Organic Search',
  paid_search: 'Paid Search',
  social: 'Social Media',
  referral: 'Referral',
  email: 'Email',
  other: 'Other',
};

export function TopTrafficSources() {
  const dateParams = useAnalyticsDateParams();
  const { data, isLoading } = useGetTrafficSourcesQuery(dateParams);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full min-h-[350px]">
        <div className="p-5 border-b border-slate-100">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const sources = data || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full min-h-[350px]">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Top Traffic Sources</h3>
      </div>

      {sources.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-6">
          <Radar className="w-6 h-6 text-slate-300" />
          <p className="text-slate-500 font-medium text-xs">
            No visits recorded yet — tracking data will appear here once your storefront receives traffic.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Source</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Sessions</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Users</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Orders</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Revenue</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((row) => (
                <tr key={row.channel} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-[12px] font-bold text-slate-900 border-b border-slate-50">
                    {CHANNEL_LABELS[row.channel] || row.channel}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600 border-b border-slate-50">
                    {row.sessions.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600 border-b border-slate-50">
                    {row.users.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600 border-b border-slate-50">
                    {row.orders.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-bold text-slate-900 border-b border-slate-50">
                    ৳{row.revenue.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600 border-b border-slate-50 text-right">
                    {row.conversionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
