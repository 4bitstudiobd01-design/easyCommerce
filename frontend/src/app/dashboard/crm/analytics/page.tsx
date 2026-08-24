'use client';

import React from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { CrmAnalyticsDashboard } from '@/features/crm/components/analytics/CrmAnalyticsDashboard';
import { useGetCrmAnalyticsQuery } from '@/features/crm/api/crmApi';
import { Loader2 } from 'lucide-react';

export default function CrmAnalyticsPage() {
  const { data: analytics, isLoading, isError } = useGetCrmAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CrmNavigationHeader
          title="CRM Retention & Customer LTV Analytics"
          subtitle="Track Customer Lifetime Value (CLV), Repeat Purchase Rate, Churn Risk Matrix, and Channel Performance"
        />
        <div className="bg-white rounded-3xl border border-slate-200/80 p-20 flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="font-bold text-sm">Loading live analytics from database...</p>
        </div>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="space-y-6">
        <CrmNavigationHeader
          title="CRM Retention & Customer LTV Analytics"
          subtitle="Track Customer Lifetime Value (CLV), Repeat Purchase Rate, Churn Risk Matrix, and Channel Performance"
        />
        <div className="bg-red-50 rounded-3xl border border-red-200 p-12 text-center text-red-500">
          <p className="font-bold">Failed to load analytics. Please check backend connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CrmNavigationHeader
        title="CRM Retention & Customer LTV Analytics"
        subtitle="Track Customer Lifetime Value (CLV), Repeat Purchase Rate, Churn Risk Matrix, and Channel Performance"
      />
      <CrmAnalyticsDashboard metrics={analytics} />
    </div>
  );
}
