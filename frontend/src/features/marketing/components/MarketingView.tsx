'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useGetMarketingDashboardQuery } from '../api/marketingApi';
import { MarketingKpiCards } from './MarketingKpiCards';
import { PixelInstanceList } from './PixelInstanceList';
import { SalesBySourceTab } from './SalesBySourceTab';

type MarketingTab = 'pixels' | 'sales-by-source';

export function MarketingView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, isLoading } = useGetMarketingDashboardQuery();

  const tabParam = searchParams.get('tab');
  const activeTab: MarketingTab =
    tabParam === 'sales-by-source' || tabParam === 'sources' || tabParam === 'sales_by_source'
      ? 'sales-by-source'
      : 'pixels';

  const handleTabChange = (tab: MarketingTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'pixels') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Marketing</h1>
        <p className="text-[13px] text-slate-500 mt-1 font-medium">
          Manage your tracking pixels and see which platforms drive your sales
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8 flex items-center gap-8 text-[13px] font-bold">
        <button
          type="button"
          onClick={() => handleTabChange('pixels')}
          className={`py-3 -mb-[1px] border-b-2 transition-colors ${
            activeTab === 'pixels'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pixels & Tracking
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('sales-by-source')}
          className={`py-3 -mb-[1px] border-b-2 transition-colors ${
            activeTab === 'sales-by-source'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales by Source
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 animate-in fade-in duration-500">
          {activeTab === 'pixels' ? (
            <>
              <MarketingKpiCards kpis={data?.kpis} isLoading={isLoading} />
              <PixelInstanceList />
            </>
          ) : (
            <SalesBySourceTab />
          )}
        </div>
      </div>
    </div>
  );
}
