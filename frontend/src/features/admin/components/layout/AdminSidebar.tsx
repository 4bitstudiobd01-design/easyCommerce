'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  Database,
  Globe,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useGetAllStoresQuery, useGetAllSystemOrdersQuery } from '../../api/adminApi';

export function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: stores = [] } = useGetAllStoresQuery();
  const { data: orders = [] } = useGetAllSystemOrdersQuery();

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
    return `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
      active
        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  return (
    <aside className="w-64 bg-white text-slate-700 shrink-0 flex flex-col min-h-screen border-r border-slate-200 sticky top-0 h-screen z-50 shadow-sm">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-base text-slate-900 tracking-tight block leading-tight">
            BitCommerce
          </span>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
            Super Admin Panel
          </span>
        </div>
      </div>

      {/* Sidebar Nav Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 text-xs font-semibold">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Platform Management
        </div>

        <Link href="/admin" className={navItemClass('/admin')}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Platform Overview</span>
        </Link>

        <Link href="/admin/stores" className={navItemClass('/admin/stores')}>
          <Building2 className="w-4 h-4" />
          <div className="flex-1 flex items-center justify-between">
            <span>Merchant Stores</span>
            {stores.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
                {stores.length}
              </span>
            )}
          </div>
        </Link>

        <Link href="/admin/orders" className={navItemClass('/admin/orders')}>
          <ShoppingCart className="w-4 h-4" />
          <div className="flex-1 flex items-center justify-between">
            <span>System Purchases</span>
            {orders.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
                {orders.length}
              </span>
            )}
          </div>
        </Link>

        <div className="pt-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">
          System & Infrastructure
        </div>

        <Link href="/admin/settings" className={navItemClass('/admin/settings')}>
          <Database className="w-4 h-4" />
          <span>System Migrations & DB</span>
        </Link>

        <Link href="/admin/cms" className={navItemClass('/admin/cms')}>
          <Globe className="w-4 h-4" />
          <span>Landing Page CMS</span>
        </Link>
      </nav>

      {/* Sidebar Footer Admin Info */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@bitcommerce.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
