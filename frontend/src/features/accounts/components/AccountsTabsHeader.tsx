'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  Receipt,
  Banknote,
  Scale,
  BookOpen,
  BookMarked,
  BarChart3,
  RefreshCw,
  Landmark,
} from 'lucide-react';

const ACCOUNTS_TABS = [
  {
    name: 'Overview',
    href: '/dashboard/accounts/overview',
    matchHref: ['/dashboard/accounts/overview', '/dashboard/accounts'],
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'Bank & Accounts',
    href: '/dashboard/accounts/bank-accounts',
    matchHref: ['/dashboard/accounts/bank-accounts', '/dashboard/accounts/accounts'],
    icon: Landmark,
  },
  {
    name: 'Transactions',
    href: '/dashboard/accounts/transactions',
    matchHref: ['/dashboard/accounts/transactions'],
    icon: ArrowLeftRight,
  },
  {
    name: 'Invoices',
    href: '/dashboard/accounts/invoices',
    matchHref: ['/dashboard/accounts/invoices'],
    icon: FileText,
  },
  {
    name: 'Bills',
    href: '/dashboard/accounts/bills',
    matchHref: ['/dashboard/accounts/bills'],
    icon: Receipt,
  },
  {
    name: 'Payroll',
    href: '/dashboard/accounts/payroll',
    matchHref: ['/dashboard/accounts/payroll'],
    icon: Banknote,
  },
  {
    name: 'Chart of Accounts',
    href: '/dashboard/accounts/chart-of-accounts',
    matchHref: ['/dashboard/accounts/chart-of-accounts'],
    icon: Scale,
  },
  {
    name: 'Journal Entries',
    href: '/dashboard/accounts/journal-entries',
    matchHref: ['/dashboard/accounts/journal-entries'],
    icon: BookOpen,
  },
  {
    name: 'General Ledger',
    href: '/dashboard/accounts/general-ledger',
    matchHref: ['/dashboard/accounts/general-ledger'],
    icon: BookMarked,
  },
  {
    name: 'Bank Reconciliation',
    href: '/dashboard/accounts/bank-reconciliation',
    matchHref: ['/dashboard/accounts/bank-reconciliation'],
    icon: RefreshCw,
  },
  {
    name: 'Reports',
    href: '/dashboard/accounts/reports',
    matchHref: ['/dashboard/accounts/reports'],
    icon: BarChart3,
  },
];

export function AccountsTabsHeader() {
  const pathname = usePathname();

  return (
    <div className="mb-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs">
        <nav
          className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
          aria-label="Accounts navigation tabs"
        >
          {ACCOUNTS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? tab.matchHref.some((exactPath) => pathname === exactPath)
              : tab.matchHref.some(
                  (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
                );

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
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
