'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  Landmark,
  Scale,
  BarChart3,
  Settings,
} from 'lucide-react';

const FINANCE_TABS = [
  {
    name: 'Overview',
    href: '/dashboard/finance/overview',
    matchHref: ['/dashboard/finance/overview', '/dashboard/finance'],
    icon: LayoutDashboard,
  },
  {
    name: 'Transactions',
    href: '/dashboard/finance/transactions',
    matchHref: ['/dashboard/finance/transactions'],
    icon: ArrowLeftRight,
  },
  {
    name: 'Income',
    href: '/dashboard/finance/income',
    matchHref: ['/dashboard/finance/income'],
    icon: TrendingUp,
  },
  {
    name: 'Expenses',
    href: '/dashboard/finance/expenses',
    matchHref: ['/dashboard/finance/expenses'],
    icon: TrendingDown,
  },
  {
    name: 'Invoices',
    href: '/dashboard/finance/invoices',
    matchHref: ['/dashboard/finance/invoices'],
    icon: FileText,
  },
  {
    name: 'Bills',
    href: '/dashboard/finance/bills',
    matchHref: ['/dashboard/finance/bills'],
    icon: Receipt,
  },
  {
    name: 'Accounts',
    href: '/dashboard/finance/accounts',
    matchHref: ['/dashboard/finance/accounts'],
    icon: Landmark,
  },
  {
    name: 'Transfers',
    href: '/dashboard/finance/transfers',
    matchHref: ['/dashboard/finance/transfers'],
    icon: Scale,
  },
  {
    name: 'Reports',
    href: '/dashboard/finance/reports',
    matchHref: ['/dashboard/finance/reports'],
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/dashboard/finance/settings',
    matchHref: ['/dashboard/finance/settings'],
    icon: Settings,
  },
];

export function FinanceTabsHeader() {
  const pathname = usePathname();

  return (
    <div className="mb-6">
      {/* Top Header Card with Horizontal Navigation Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs">
        <nav
          className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
          aria-label="Finance navigation tabs"
        >
          {FINANCE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.matchHref.includes(pathname);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isActive ? 'text-white scale-105' : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
