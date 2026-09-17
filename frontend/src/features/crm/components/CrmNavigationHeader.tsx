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
  Search,
  MessageSquare,
  KeyRound,
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
  title = 'CRM & Customer Relationships',
  subtitle,
  activeCount,
  onSearchChange,
  searchValue = '',
  searchPlaceholder = 'Search records...',
  onAddClick,
  addLabel = 'New Record',
  secondaryAction,
}) => {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'customers',
      label: 'Customers 360',
      href: '/dashboard/crm/customers',
      icon: Users,
    },
    {
      id: 'leads',
      label: 'Leads Pipeline',
      href: '/dashboard/crm/leads',
      icon: Target,
    },
    {
      id: 'chat',
      label: 'Omnichannel Chat',
      href: '/dashboard/crm/chat',
      icon: MessageSquare,
    },
    {
      id: 'channels',
      label: 'Channel Credentials',
      href: '/dashboard/crm/channels',
      icon: KeyRound,
    },
    {
      id: 'segments',
      label: 'Segments & Groups',
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
    <div className="space-y-4 mb-6">
      {/* 1. Page Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span>CRM & Growth</span>
            <span>&gt;</span>
            <span className="text-slate-700 font-bold">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            {typeof activeCount === 'number' && (
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full text-xs font-bold">
                {activeCount}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
          {secondaryAction}

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation Pills Bar & Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-2xs inline-flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full">
          {tabs.map((tab) => {
            const active = isTabActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Quick Search Input */}
        {onSearchChange && (
          <div className="relative w-full md:w-64">
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
