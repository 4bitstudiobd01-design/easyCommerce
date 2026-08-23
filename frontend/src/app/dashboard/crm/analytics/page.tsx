'use client';

import React from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { CrmAnalyticsDashboard } from '@/features/crm/components/analytics/CrmAnalyticsDashboard';
import { useGetCrmAnalyticsQuery } from '@/features/crm/api/crmApi';
import { mockCrmAnalytics } from '@/features/crm/data/crmMockData';

export default function CrmAnalyticsPage() {
  const { data: serverAnalytics } = useGetCrmAnalyticsQuery();
  const analyticsData = serverAnalytics || mockCrmAnalytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <CrmNavigationHeader
        title="CRM Retention & Customer LTV Analytics"
        subtitle="Track Customer Lifetime Value (CLV), Repeat Purchase Rate, Churn Risk Matrix, and Channel Performance"
      />

      {/* Analytics Dashboard */}
      <CrmAnalyticsDashboard metrics={analyticsData} />
    </div>
  );
}
