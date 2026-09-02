'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PurchaseTabsHeader, PurchaseTabKey } from './PurchaseTabsHeader';
import { PurchaseOverviewView } from './PurchaseOverviewView';
import { SuppliersView } from './SuppliersView';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { PurchasesListView } from './PurchasesListView';

interface PurchaseMainViewProps {
  initialTab?: PurchaseTabKey;
}

const VALID_TABS: PurchaseTabKey[] = ['overview', 'suppliers', 'purchase-orders', 'purchases'];

export function PurchaseMainView({ initialTab }: PurchaseMainViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as PurchaseTabKey | null;

  const resolveTab = (): PurchaseTabKey => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      return tabParam;
    }
    if (initialTab && VALID_TABS.includes(initialTab)) {
      return initialTab;
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<PurchaseTabKey>(resolveTab);

  // Sync tab with URL search parameter changes
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam && initialTab) {
      setActiveTab(initialTab);
    }
  }, [tabParam, initialTab]);

  const handleTabChange = (newTab: PurchaseTabKey) => {
    setActiveTab(newTab);
    const targetUrl = newTab === 'overview' ? '/dashboard/purchase' : `/dashboard/purchase?tab=${newTab}`;
    router.push(targetUrl, { scroll: false });
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Purchase Horizontal Sub-Navigation Tabs */}
      <PurchaseTabsHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 2. Active Tab Sub-View Content */}
      <div className="w-full">
        {activeTab === 'overview' && (
          <PurchaseOverviewView onNavigateTab={handleTabChange} />
        )}
        {activeTab === 'suppliers' && <SuppliersView />}
        {activeTab === 'purchase-orders' && <PurchaseOrdersView />}
        {activeTab === 'purchases' && <PurchasesListView />}
      </div>
    </div>
  );
}
