'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, Store as StoreIcon } from 'lucide-react';
import {
  useGetPlatformStatsQuery,
  useGetAllStoresQuery,
  useGetAllSystemOrdersQuery,
} from '../../api/adminApi';

export function AdminHeader() {
  const pathname = usePathname();

  const { refetch: refetchStats } = useGetPlatformStatsQuery();
  const { refetch: refetchStores } = useGetAllStoresQuery();
  const { refetch: refetchOrders } = useGetAllSystemOrdersQuery();

  const handleRefreshAll = () => {
    refetchStats();
    refetchStores();
    refetchOrders();
  };

  const getTitle = () => {
    if (pathname === '/admin') return 'Platform Overview & Revenue';
    if (pathname.startsWith('/admin/stores')) return 'Merchant Stores Directory';
    if (pathname.startsWith('/admin/orders')) return 'System-Wide Customer Purchases';
    if (pathname.startsWith('/admin/settings')) return 'System Infrastructure & Database';
    if (pathname.startsWith('/admin/cms')) return 'Global Landing Page CMS';
    return 'Super Admin Control Center';
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Active Tab Title */}
      <div className="flex items-center gap-3">
        <h2 className="font-extrabold text-base text-slate-900 capitalize">{getTitle()}</h2>
        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-full border border-blue-200">
          Super-Admin Control
        </span>
      </div>

      {/* Header Action Items */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRefreshAll}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Refresh Data</span>
        </button>

        <Link
          href="/dashboard"
          className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200/80 transition-colors flex items-center gap-1.5"
        >
          <StoreIcon className="w-4 h-4 text-blue-600" />
          <span>Switch to Merchant View</span>
        </Link>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Operational</span>
          </span>
        </div>
      </div>
    </header>
  );
}
