'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, X } from 'lucide-react';
import { ADMIN_ROUTES } from '../../config/dashboard.routes';

export interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function DashboardSidebar({ isOpen = false, onClose, className = '' }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-50 border-r border-slate-800 transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${className}`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block leading-tight">
                EasyCommerce
              </span>
              <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider block">
                Super Admin
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Routes Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 text-xs font-semibold overflow-y-auto">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Platform Management
          </div>

          {ADMIN_ROUTES.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href || (route.href !== '/admin' && pathname.startsWith(route.href));

            return (
              <Link
                key={route.id}
                href={route.href}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-semibold'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] font-bold text-slate-500 text-center">
          EasyCommerce Enterprise v1.0.0
        </div>
      </aside>
    </>
  );
}
