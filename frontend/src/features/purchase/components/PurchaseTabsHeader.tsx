'use client';

import React from 'react';
import Link from 'next/link';

export type PurchaseTabKey = 'overview' | 'suppliers' | 'purchase-orders' | 'purchases';

export interface PurchaseTabItem {
  id: PurchaseTabKey;
  label: string;
  href: string;
}

export const PURCHASE_TABS: PurchaseTabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/dashboard/purchase',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    href: '/dashboard/purchase?tab=suppliers',
  },
  {
    id: 'purchase-orders',
    label: 'Purchase Orders',
    href: '/dashboard/purchase?tab=purchase-orders',
  },
  {
    id: 'purchases',
    label: 'Purchases',
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
    <nav aria-label="Purchase sections" className="border-b border-slate-200">
      <ul className="flex items-center gap-1 overflow-x-auto">
        {PURCHASE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => {
                  // If not middle-clicked or ctrl/cmd-clicked, intercept and switch smoothly
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onTabChange(tab.id);
                  }
                }}
                className={`inline-block px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
