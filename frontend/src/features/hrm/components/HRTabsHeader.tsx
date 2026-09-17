'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserCircle2,
  UserCog,
  Building2,
  CalendarCheck,
  CalendarRange,
  PartyPopper,
  Clock3,
  Receipt,
  Wallet,
  Megaphone,
  BarChart3,
} from 'lucide-react';

const HR_TABS = [
  { name: 'My Leave (ESS)', href: '/dashboard/hr/my-leave', icon: UserCircle2 },
  { name: 'Employees', href: '/dashboard/hr/employees', icon: UserCog },
  { name: 'Departments', href: '/dashboard/hr/departments', icon: Building2 },
  { name: 'Attendance', href: '/dashboard/hr/attendance', icon: CalendarCheck },
  { name: 'Leave Requests', href: '/dashboard/hr/leave', icon: CalendarRange },
  { name: 'Holidays', href: '/dashboard/hr/holidays', icon: PartyPopper },
  { name: 'Shifts & Roster', href: '/dashboard/hr/shifts', icon: Clock3 },
  { name: 'Employee Expenses', href: '/dashboard/hr/expenses', icon: Receipt },
  { name: 'Payroll', href: '/dashboard/hr/payroll', icon: Wallet },
  { name: 'Notice Board', href: '/dashboard/hr/notices', icon: Megaphone },
  { name: 'HR Reports', href: '/dashboard/hr/reports', icon: BarChart3 },
];

export function HRTabsHeader() {
  const pathname = usePathname();

  return (
    <div className="mb-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs">
        <nav
          className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
          aria-label="Human Resources navigation tabs"
        >
          {HR_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

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
