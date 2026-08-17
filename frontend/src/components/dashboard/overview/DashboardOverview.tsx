'use client';

import React from 'react';
import { OverviewHeader } from './OverviewHeader';
import { KpiStatsGrid } from './KpiStatsGrid';
import { RevenueOverviewChart } from './RevenueOverviewChart';
import { MerchantGrowthChart } from './MerchantGrowthChart';
import { SubscriptionOverviewChart } from './SubscriptionOverviewChart';
import { PlatformHealthCard } from './PlatformHealthCard';
import { RecentActivityList } from './RecentActivityList';
import { TopMerchantsTable } from './TopMerchantsTable';
import { AlertsNotifications } from './AlertsNotifications';
import { QuickActions } from './QuickActions';

import {
  KPI_METRICS,
  REVENUE_DATA,
  MERCHANT_GROWTH_DATA,
  MERCHANT_GROWTH_SUMMARY,
  SUBSCRIPTION_BREAKDOWN,
  SUBSCRIPTION_SUMMARY,
  SERVICES_STATUS,
  PLATFORM_HEALTH_METRICS,
  RECENT_ACTIVITIES,
  TOP_MERCHANTS,
  ALERTS_NOTIFICATIONS,
  QUICK_ACTIONS,
} from '../data/dashboardMockData';

export function DashboardOverview() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. Page Header (Title, Date Range Filter, Export Report) */}
      <OverviewHeader
        title="Dashboard Overview"
        subtitle="Real-time overview of your EasyCommerce platform"
      />

      {/* 2. Top KPI Stat Cards (6 Key Platform Metrics) */}
      <KpiStatsGrid metrics={KPI_METRICS} />

      {/* 3. Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6">
        <div className="md:col-span-2 xl:col-span-1">
          <RevenueOverviewChart data={REVENUE_DATA} />
        </div>
        <MerchantGrowthChart
          data={MERCHANT_GROWTH_DATA}
          summary={MERCHANT_GROWTH_SUMMARY}
        />
        <SubscriptionOverviewChart
          breakdown={SUBSCRIPTION_BREAKDOWN}
          summary={SUBSCRIPTION_SUMMARY}
        />
      </div>

      {/* 4. Detailed Status & Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6">
        <div className="md:col-span-2 xl:col-span-1">
          <PlatformHealthCard
            services={SERVICES_STATUS}
            metrics={PLATFORM_HEALTH_METRICS}
          />
        </div>
        <RecentActivityList activities={RECENT_ACTIVITIES} />
        <TopMerchantsTable merchants={TOP_MERCHANTS} />
      </div>

      {/* 5. Alerts & Quick Actions Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 xl:gap-6">
        <div className="xl:col-span-2">
          <AlertsNotifications alerts={ALERTS_NOTIFICATIONS} />
        </div>
        <div>
          <QuickActions actions={QUICK_ACTIONS} />
        </div>
      </div>
    </div>
  );
}
