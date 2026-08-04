'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Menu } from 'lucide-react';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { NotificationBellDrawer } from '@/features/sms/components/NotificationBellDrawer';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const { data: store } = useGetMyStoreQuery();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Search Input & Hamburger */}
      <div className="flex items-center gap-4 w-full max-w-sm">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search products, orders, customers..."
          className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
        />
        </div>
      </div>

      {/* Header Action Items */}
      <div className="flex items-center gap-4">
        {store && (
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200/80 flex items-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Visit {store.name}</span>
          </Link>
        )}

        <NotificationBellDrawer />

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tenant ID: {store?.tenantId?.slice(0, 8) || 'Isolated'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};
