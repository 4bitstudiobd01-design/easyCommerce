'use client';

import React from 'react';
import { AnalyticsHeader } from './AnalyticsHeader';
import { AnalyticsTabs } from './AnalyticsTabs';
import { AnalyticsKpiCards } from './AnalyticsKpiCards';
import { RevenueOverviewChart } from './RevenueOverviewChart';
import { SalesByChannelChart } from './SalesByChannelChart';
import { TopPerformingProducts } from './TopPerformingProducts';
import { OrdersOverviewChart } from './OrdersOverviewChart';
import { NewVsReturningChart } from './NewVsReturningChart';
import { CustomerOverviewChart } from './CustomerOverviewChart';
import { TopTrafficSources } from './TopTrafficSources';
import { InsightsList } from './InsightsList';
import { AnalyticsFiltersProvider } from '../context/AnalyticsFiltersContext';

export function AnalyticsOverview() {
  return (
    <AnalyticsFiltersProvider>
      <AnalyticsOverviewInner />
    </AnalyticsFiltersProvider>
  );
}

function AnalyticsOverviewInner() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AnalyticsHeader />
      <AnalyticsTabs />
      
      <div className="p-8 space-y-6">
        <AnalyticsKpiCards />
        
        {/* Row 2: Revenue, Sales by Channel, Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <RevenueOverviewChart />
          </div>
          <div className="lg:col-span-3">
            <SalesByChannelChart />
          </div>
          <div className="lg:col-span-3">
            <TopPerformingProducts />
          </div>
        </div>

        {/* Row 3: Orders, New vs Returning, Customer Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <OrdersOverviewChart />
          </div>
          <div className="lg:col-span-4">
            <NewVsReturningChart />
          </div>
          <div className="lg:col-span-3">
            <CustomerOverviewChart />
          </div>
        </div>

        {/* Row 4: Top Traffic Sources, Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <TopTrafficSources />
          </div>
          <div className="lg:col-span-4">
            <InsightsList />
          </div>
        </div>
      </div>
    </div>
  );
}
