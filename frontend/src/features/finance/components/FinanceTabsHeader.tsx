'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Banknote,
  FileText,
  Landmark,
  Scale,
  BarChart3,
  History,
  Settings,
  ClipboardCheck,
} from 'lucide-react';
import { useGetRequisitionStatsQuery } from '../api/financeApi';

const FINANCE_TABS = [
  {
    name: 'Overview',
    href: '/dashboard/finance/overview',
    exact: true,
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
    name: 'Salary Payments',
    href: '/dashboard/finance/salaries',
    matchHref: ['/dashboard/finance/salaries'],
    icon: Banknote,
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
    name: 'Requisitions',
    href: '/dashboard/finance/requisitions',
    matchHref: ['/dashboard/finance/requisitions'],
    icon: ClipboardCheck,
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
    name: 'History',
    href: '/dashboard/finance/history',
    matchHref: ['/dashboard/finance/history'],
    icon: History,
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
  const { data: stats } = useGetRequisitionStatsQuery(undefined, {
    pollingInterval: 30000,
  });
  const pendingCount = stats?.pendingCount ?? 0;

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
            const isActive = tab.exact
              ? tab.matchHref.some((exactPath) => pathname === exactPath)
              : tab.matchHref.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.name}</span>
                {tab.name === 'Requisitions' && pendingCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${
                      isActive
                        ? 'bg-white text-rose-600'
                        : 'bg-rose-500 text-white shadow-xs'
                    } animate-pulse`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
