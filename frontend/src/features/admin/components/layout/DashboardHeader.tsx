'use client';

import React from 'react';
import Link from 'next/link';
import { Store as StoreIcon, Bell, Menu, ShieldCheck, LogOut } from 'lucide-react';
import { StatusBadge } from '../core/StatusBadge';

export interface DashboardHeaderProps {
  userName?: string;
  userEmail?: string;
  onMenuToggle?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function DashboardHeader({
  userName = 'Super Admin',
  userEmail = 'admin@bitcommerce.com',
  onMenuToggle,
  onLogout,
  className = '',
}: DashboardHeaderProps) {
  return (
    <header className={`h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs ${className}`}>
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Mobile Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-xl font-extrabold flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">BitCommerce Admin</h1>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block -mt-0.5 uppercase tracking-wider">Enterprise Control Center</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <StatusBadge status="operational" label="System Operational" className="hidden sm:inline-flex" />

        <Link
          href="/dashboard"
          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5"
        >
          <StoreIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Merchant View</span>
        </Link>

        <Link
          href="/admin#notifications-widget"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
          aria-label="Notifications"
          title="View platform notifications"
        >
          <Bell className="w-4 h-4" />
        </Link>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
            {userName[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">{userName}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{userEmail}</p>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
