'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  UserCheck,
  FileText,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

export type PurchaseTabKey = 'overview' | 'suppliers' | 'purchase-orders' | 'purchases';

export interface PurchaseTabItem {
  id: PurchaseTabKey;
  label: string;
  icon: LucideIcon;
  href: string;
}

export const PURCHASE_TABS: PurchaseTabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    href: '/dashboard/purchase',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: UserCheck,
    href: '/dashboard/purchase?tab=suppliers',
  },
  {
    id: 'purchase-orders',
    label: 'Purchase Orders',
    icon: FileText,
    href: '/dashboard/purchase?tab=purchase-orders',
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: Receipt,
    href: '/dashboard/purchase?tab=purchases',
  },
];

interface PurchaseTabsHeaderProps {
  activeTab: PurchaseTabKey;
  onTabChange: (tab: PurchaseTabKey) => void;
}

export function PurchaseTabsHeader({
  activeTab,
  onTabChange,
}: PurchaseTabsHeaderProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-2xs mb-6">
      <nav
        className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
        aria-label="Purchase navigation tabs"
      >
        {PURCHASE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={(e) => {
                // If not middle-clicked or ctrl/cmd-clicked, intercept and switch smoothly
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onTabChange(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 select-none cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform duration-200 ${
                  isActive ? 'text-white scale-105' : 'text-slate-400 group-hover:text-slate-600'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
