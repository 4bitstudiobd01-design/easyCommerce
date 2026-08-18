'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import {
  LayoutDashboard,
  Building2,
  Store,
  CreditCard,
  Package,
  Receipt,
  Gauge,
  LifeBuoy,
  Bell,
  Plug,
  Activity,
  UserCog,
  KeyRound,
  FileClock,
  ShieldAlert,
  Settings,
  Flag,
  Server,
  Wrench,
  TrendingUp,
  LineChart,
  FileBarChart,
  ChevronLeft,
  LogOut,
  ShoppingBag,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Merchants', href: '/admin/merchants', icon: Building2 },
      { label: 'Stores', href: '/admin/stores', icon: Store },
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { label: 'Plans', href: '/admin/plans', icon: Package },
      { label: 'Transactions', href: '/admin/orders', icon: Receipt },
      { label: 'Usage & Limits', href: '/admin/usage-limits', icon: Gauge },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Support', href: '/admin/support', icon: LifeBuoy },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell, badge: '12' },
      { label: 'Integrations', href: '/admin/integrations', icon: Plug },
      { label: 'System Health', href: '/admin/system-health', icon: Activity },
    ],
  },
  {
    label: 'Security',
    items: [
      { label: 'Admin Users', href: '/admin/users', icon: UserCog },
      { label: 'Roles & Permissions', href: '/admin/roles-permissions', icon: KeyRound },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileClock },
      { label: 'Security', href: '/admin/security', icon: ShieldAlert },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
      { label: 'Feature Flags', href: '/admin/feature-flags', icon: Flag },
      { label: 'Background Jobs', href: '/admin/background-jobs', icon: Server },
      { label: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Revenue', href: '/admin/revenue', icon: TrendingUp },
      { label: 'Merchant Growth', href: '/admin/merchant-growth', icon: LineChart },
      { label: 'System Reports', href: '/admin/system-reports', icon: FileBarChart },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully.');
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true;
    if (path !== '/admin' && pathname.startsWith(path)) return true;
    return false;
  };

  const navItemClass = (path: string) => {
    const active = isActive(path);
    return `w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
      active
        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white text-slate-700 shrink-0 flex flex-col min-h-screen border-r border-slate-200 sticky top-0 h-screen z-50 shadow-sm transition-all duration-200`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shrink-0">
          <ShoppingBag className="w-5 h-5 fill-current" strokeWidth={1.5} />
        </div>
        {!isCollapsed && (
          <div className="truncate">
            <span className="font-extrabold text-base text-slate-900 tracking-tight block leading-tight truncate">
              BitCommerce
            </span>
            <span className="text-[10px] font-bold text-slate-400 block truncate">Platform Admin</span>
          </div>
        )}
      </div>

      {/* Sidebar Nav Items */}
      <nav className="flex-1 px-3 py-5 space-y-5 text-xs font-semibold overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className={navItemClass(item.href)} title={item.label}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-md shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Admin Info */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName || 'Platform Admin'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'superadmin@easyco.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-bold"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
