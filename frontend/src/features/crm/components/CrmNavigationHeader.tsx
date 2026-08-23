'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Target,
  Layers,
  Activity,
  BarChart3,
  Plus,
  Sparkles,
  Search,
  PhoneCall,
  UserPlus,
  Filter,
} from 'lucide-react';

interface CrmNavigationHeaderProps {
  title?: string;
  subtitle?: string;
  activeCount?: number;
  onSearchChange?: (q: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onAddClick?: () => void;
  addLabel?: string;
  secondaryAction?: React.ReactNode;
}

export const CrmNavigationHeader: React.FC<CrmNavigationHeaderProps> = ({
  title = 'Customer Relationship Management',
  subtitle = 'Manage customer 360° profiles, sales leads pipeline, and omnichannel engagement',
  activeCount,
  onSearchChange,
  searchValue = '',
  searchPlaceholder = 'Search in CRM...',
  onAddClick,
  addLabel = 'New Record',
  secondaryAction,
}) => {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'customers',
      label: 'Customers',
      href: '/dashboard/crm/customers',
      icon: Users,
      badge: 'Directory',
    },
    {
      id: 'leads',
      label: 'Leads Pipeline',
      href: '/dashboard/crm/leads',
      icon: Target,
      badge: 'Kanban',
    },
    {
      id: 'segments',
      label: 'Audience Segments',
      href: '/dashboard/crm/segments',
      icon: Layers,
    },
    {
      id: 'activities',
      label: 'Activity Hub',
      href: '/dashboard/crm/activities',
      icon: Activity,
    },
    {
      id: 'analytics',
      label: 'Retention Analytics',
      href: '/dashboard/crm/analytics',
      icon: BarChart3,
    },
  ];

  const isTabActive = (href: string) => {
    if (pathname === href) return true;
    if (href === '/dashboard/crm/customers' && (pathname === '/dashboard/crm' || pathname === '/dashboard/customers')) {
      return true;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full mb-8">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {title}
                </h1>
                {typeof activeCount === 'number' && (
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full text-xs font-bold">
                    {activeCount}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  CRM Suite
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {secondaryAction}

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs md:text-sm font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const active = isTabActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                      active ? 'bg-slate-800 text-blue-300' : 'bg-white text-slate-500 shadow-2xs'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Search */}
        {onSearchChange && (
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all shadow-2xs"
            />
          </div>
        )}
      </div>
    </div>
  );
};
