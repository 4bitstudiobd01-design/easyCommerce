'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { NotificationBellDrawer } from '@/features/sms/components/NotificationBellDrawer';
import { UserProfileMenu } from '@/features/auth/components/UserProfileMenu';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  isDesktopCollapsed?: boolean;
}

export const DashboardHeader = ({ onMenuClick, isDesktopCollapsed = false }: DashboardHeaderProps) => {
  const { data: store } = useGetMyStoreQuery();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Hamburger / Collapse Toggle + Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center"
          title={isDesktopCollapsed ? 'Expand Sidebar' : 'Minimize Sidebar'}
          aria-label="Toggle Sidebar Menu"
        >
          {isDesktopCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all font-medium"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400 shadow-2xs">
              ⌘ K
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* Visit Store button */}
        {store && (
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 rounded-lg transition-colors"
          >
            <span>Visit Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}

        {/* Notification bell */}
        <NotificationBellDrawer />

        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* =======================================================================
            USER PROFILE PILL & RICH DROPDOWN (SYNCED WITH LANDING NAVBAR)
        ======================================================================= */}
        <UserProfileMenu />
      </div>
    </header>
  );
};
