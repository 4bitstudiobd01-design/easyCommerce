import React from 'react';
import { RevenueChart } from '@/features/analytics/components/RevenueChart';
import { TopProductsCard } from '@/features/analytics/components/TopProductsCard';

export function MerchantRevenueChartWidget() {
  return (
    <div className="h-full">
      <RevenueChart />
    </div>
  );
}

export function MerchantTopProductsWidget() {
  return (
    <div className="h-full">
      <TopProductsCard />
    </div>
  );
}
