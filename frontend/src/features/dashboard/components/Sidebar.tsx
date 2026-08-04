'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Truck,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Tag,
  Star,
  Layers,
  ArrowRightLeft,
  ShieldCheck,
  Settings,
  LogOut,
  Store as StoreIcon,
} from 'lucide-react';
import { StoreSwitcherDropdown } from '@/features/tenant/components/StoreSwitcherDropdown';
import { CreateStoreModal } from '@/features/tenant/components/CreateStoreModal';
import { useState } from 'react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const [isCreateStoreModalOpen, setIsCreateStoreModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  const navItemClass = (path: string) => {
    const active = isActive(path);
    return `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
      active
        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;
  };

  return (
    <>
      <CreateStoreModal
        isOpen={isCreateStoreModalOpen}
        onSuccess={() => setIsCreateStoreModalOpen(false)}
      />
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block leading-none">
                EasyCommerce
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mt-1">
                Merchant Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section Links (Scrollable area) */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 text-xs font-semibold [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80">
          
          <div className="mb-6 pb-4 border-b border-slate-800/60">
            <StoreSwitcherDropdown onCreateNewStore={() => setIsCreateStoreModalOpen(true)} />
          </div>

          {/* --- Main Menu --- */}
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Main Menu
          </div>

          <Link href="/dashboard" className={navItemClass('/dashboard')}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link href="/dashboard/orders" className={navItemClass('/dashboard/orders')}>
            <ShoppingCart className="w-4 h-4" />
            <span>Orders & Sales</span>
          </Link>

          <Link href="/dashboard/products" className={navItemClass('/dashboard/products')}>
            <Package className="w-4 h-4" />
            <span>Products & Catalog</span>
          </Link>

          <Link href="/dashboard/categories" className={navItemClass('/dashboard/categories')}>
            <FolderTree className="w-4 h-4" />
            <span>Categories</span>
          </Link>

          <Link href="/dashboard/customers" className={navItemClass('/dashboard/customers')}>
            <Users className="w-4 h-4" />
            <span>Customers</span>
          </Link>

          <Link href="/dashboard/logistics" className={navItemClass('/dashboard/logistics')}>
            <Truck className="w-4 h-4" />
            <span>Logistics & Shipments</span>
          </Link>

          {/* --- Shop & Growth --- */}
          <div className="px-3 py-2 pt-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Shop & Growth
          </div>

          <Link href="/dashboard/themes" className={navItemClass('/dashboard/themes').replace('bg-blue-600', 'bg-amber-600').replace('shadow-blue-600', 'shadow-amber-600')}>
            <Sparkles className={`w-4 h-4 ${isActive('/dashboard/themes') ? '' : 'text-amber-400'}`} />
            <span>Theme Marketplace</span>
          </Link>

          <Link href="/dashboard/net-profit" className={navItemClass('/dashboard/net-profit').replace('bg-blue-600', 'bg-emerald-600').replace('shadow-blue-600', 'shadow-emerald-600')}>
            <TrendingUp className={`w-4 h-4 ${isActive('/dashboard/net-profit') ? '' : 'text-emerald-400'}`} />
            <span>Net Profit Analytics</span>
          </Link>

          <Link href="/dashboard/email-marketing" className={navItemClass('/dashboard/email-marketing')}>
            <MessageSquare className={`w-4 h-4 ${isActive('/dashboard/email-marketing') ? '' : 'text-blue-400'}`} />
            <span>Email Marketing</span>
          </Link>

          <Link href="/dashboard/marketing" className={navItemClass('/dashboard/marketing').replace('bg-blue-600', 'bg-purple-600').replace('shadow-blue-600', 'shadow-purple-600')}>
            <TrendingUp className={`w-4 h-4 ${isActive('/dashboard/marketing') ? '' : 'text-purple-400'}`} />
            <span>Marketing & Pixels</span>
          </Link>

          <Link href="/dashboard/coupons" className={navItemClass('/dashboard/coupons')}>
            <Tag className="w-4 h-4" />
            <span>Promo Coupons</span>
          </Link>

          <Link href="/dashboard/sms" className={navItemClass('/dashboard/sms')}>
            <MessageSquare className="w-4 h-4" />
            <span>SMS Alerts</span>
          </Link>

          <Link href="/dashboard/reviews" className={navItemClass('/dashboard/reviews')}>
            <Star className={`w-4 h-4 ${isActive('/dashboard/reviews') ? '' : 'text-amber-400'}`} />
            <span>Customer Reviews</span>
          </Link>

          <Link href="/dashboard/abandoned-carts" className={navItemClass('/dashboard/abandoned-carts').replace('bg-blue-600', 'bg-orange-600').replace('shadow-blue-600', 'shadow-orange-600')}>
            <ShoppingCart className={`w-4 h-4 ${isActive('/dashboard/abandoned-carts') ? '' : 'text-orange-400'}`} />
            <span>Abandoned Carts</span>
          </Link>


          {/* --- Operations & Inventory --- */}
          <div className="px-3 py-2 pt-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operations & Inventory
          </div>

          <Link href="/dashboard/inventory" className={navItemClass('/dashboard/inventory')}>
            <Layers className="w-4 h-4" />
            <span>Inventory Control</span>
          </Link>

          <Link href="/dashboard/warehouse-transfers" className={navItemClass('/dashboard/warehouse-transfers')}>
            <ArrowRightLeft className={`w-4 h-4 ${isActive('/dashboard/warehouse-transfers') ? '' : 'text-blue-400'}`} />
            <span>Warehouse Transfers</span>
          </Link>

          <Link href="/dashboard/staff" className={navItemClass('/dashboard/staff')}>
            <ShieldCheck className={`w-4 h-4 ${isActive('/dashboard/staff') ? '' : 'text-blue-400'}`} />
            <span>Staff & Roles</span>
          </Link>


          {/* --- Settings & Setup --- */}
          <div className="px-3 py-2 pt-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Settings & Setup
          </div>

          <Link href="/dashboard/settings" className={navItemClass('/dashboard/settings')}>
            <Settings className="w-4 h-4" />
            <span>Store Settings</span>
          </Link>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'M'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Merchant Account'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'merchant@easycommerce.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
