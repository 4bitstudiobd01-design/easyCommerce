'use client';

import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { useRouter } from 'next/navigation';

// New Dashboard Components
import { DashboardHeaderTitle } from '@/features/dashboard/components/home/DashboardHeaderTitle';
import { KpiSection } from '@/features/dashboard/components/home/KpiSection';
import { NeedsAttention } from '@/features/dashboard/components/home/NeedsAttention';
import { RecentOrdersTable } from '@/features/dashboard/components/home/RecentOrdersTable';
import { LowStockList } from '@/features/dashboard/components/home/LowStockList';
import { TopProductsList } from '@/features/dashboard/components/home/TopProductsList';
import { SetupChecklist } from '@/features/dashboard/components/home/SetupChecklist';
import { RevenueChart } from '@/features/analytics/components/RevenueChart';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { data: store, refetch: refetchStore } = useGetMyStoreQuery();

  // Handle theme payment redirects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const themePayment = params.get('theme_payment');
      if (themePayment === 'success') {
        if (store) {
          try {
            refetchStore();
          } catch (e) {}
        }
        toast.success(`🎉 Payment Successful via SSLCommerz! Premium Theme unlocked and activated.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push('/dashboard/themes');
      } else if (themePayment === 'failed' || themePayment === 'cancelled') {
        toast.error(`Payment ${themePayment}. Theme unlock was not completed.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push('/dashboard/themes');
      }
    }
  }, [store, router, refetchStore]);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-8">
      {/* 1. Header Area */}
      <DashboardHeaderTitle />

      {/* 2. New Merchant Setup Checklist */}
      <SetupChecklist />

      {/* 3. KPI Metrics (4 Cards) */}
      <KpiSection />

      {/* 4. Sales Overview & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="lg:col-span-1">
          <NeedsAttention />
        </div>
      </div>

      {/* 5 & 6. Recent Orders and Inventory/Products stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Recent Orders (2/3 width) */}
        <div className="lg:col-span-2">
          <RecentOrdersTable />
        </div>

        {/* Right Side: Low Stock & Top Products (1/3 width, stacked) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <LowStockList />
          <TopProductsList />
        </div>
      </div>
    </div>
  );
}
