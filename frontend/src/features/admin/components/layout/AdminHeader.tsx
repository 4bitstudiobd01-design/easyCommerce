'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Menu, Search, ExternalLink, Bell, ChevronDown } from 'lucide-react';

export function AdminHeader() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
      <button
        type="button"
        title="Toggle sidebar"
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="relative flex-1 max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search merchants, stores, plans, transactions..."
          className="w-full pl-10 pr-14 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md">
          ⌘K
        </span>
      </div>

      <div className="flex items-center gap-4 ml-auto shrink-0">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          <span>Visit Platform</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <button
          type="button"
          title="Notifications"
          className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button type="button" className="flex items-center gap-2.5 hover:bg-slate-50 rounded-xl p-1.5 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'PA'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.fullName || 'Platform Admin'}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{user?.email || 'superadmin@easyco.com'}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
        </button>
      </div>
    </header>
  );
}
