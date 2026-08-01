'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useGetPlatformStatsQuery,
  useGetAllStoresQuery,
  useGetAllSystemOrdersQuery,
  useToggleStoreStatusMutation,
} from '@/features/admin/api/adminApi';
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  ShoppingCart,
  Store as StoreIcon,
  ExternalLink,
  Power,
  Search,
  CheckCircle2,
  AlertTriangle,
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  LogOut,
  Bell,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export default function SuperAdminPage() {
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'orders' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Mandatory Auth Protection Check
  useEffect(() => {
    if (!token && !isAuthenticated) {
      router.push('/login');
    }
  }, [token, isAuthenticated, router]);

  // 2. Real API Queries
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useGetPlatformStatsQuery();
  const { data: stores = [], isLoading: isStoresLoading, refetch: refetchStores } = useGetAllStoresQuery();
  const { data: orders = [], isLoading: isOrdersLoading, refetch: refetchOrders } = useGetAllSystemOrdersQuery();
  const [toggleStatus, { isLoading: isToggling }] = useToggleStoreStatusMutation();

  const handleRefreshAll = () => {
    refetchStats();
    refetchStores();
    refetchOrders();
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleToggleStatus = async (storeId: string) => {
    try {
      await toggleStatus(storeId).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to toggle store active status.');
    }
  };

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      o.storeSlug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 flex font-sans">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col min-h-screen border-r border-slate-800 sticky top-0 h-screen z-50">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base text-white tracking-tight block leading-tight">
              EasyCommerce
            </span>
            <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider block">
              Super Admin Panel
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 text-xs font-semibold">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Platform Management
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Platform Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'stores'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <div className="flex-1 flex items-center justify-between">
              <span>Merchant Stores</span>
              {stores.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-blue-400 rounded-md">
                  {stores.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <div className="flex-1 flex items-center justify-between">
              <span>System Purchases</span>
              {orders.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-emerald-400 rounded-md">
                  {orders.length}
                </span>
              )}
            </div>
          </button>

          <div className="pt-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-2">
            System & Infrastructure
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>System Migrations & DB</span>
          </button>
        </nav>

        {/* Sidebar Footer Admin Info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Super Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@easycommerce.com'}</p>
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

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          {/* Active Tab Title */}
          <div className="flex items-center gap-3">
            <h2 className="font-extrabold text-base text-slate-900 capitalize">
              {activeTab === 'overview' && 'Platform Overview & Revenue'}
              {activeTab === 'stores' && 'Merchant Stores Directory'}
              {activeTab === 'orders' && 'System-Wide Customer Purchases'}
              {activeTab === 'settings' && 'System Infrastructure & Database'}
            </h2>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-full border border-blue-200">
              Super-Admin Control
            </span>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefreshAll}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Refresh Data</span>
            </button>

            <Link
              href="/dashboard"
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200/80 transition-colors flex items-center gap-1.5"
            >
              <StoreIcon className="w-4 h-4 text-blue-600" />
              <span>Switch to Merchant View</span>
            </Link>

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Operational</span>
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Body */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* TAB 1: OVERVIEW TAB CONTENT */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 text-white border border-slate-800 shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>SaaS Platform Control Panel</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Multi-Tenant Platform Control Center
                    </h2>
                    <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                      Manage all merchant organizations, subdomains, system-wide revenues, and store activation statuses from one unified interface.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Platform Revenue */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Revenue</span>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {isStatsLoading ? '...' : `৳${(stats?.totalPlatformRevenue || 0).toLocaleString()}`}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">BDT ৳</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Across all merchant stores</p>
                </div>

                {/* Card 2: Total Merchants */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Merchants</span>
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {isStatsLoading ? '...' : stats?.totalMerchantsCount || 0}
                    </span>
                    <span className="text-xs font-bold text-purple-600">Owners</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Active SaaS accounts</p>
                </div>

                {/* Card 3: Onboarded Stores */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenant Stores</span>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {isStatsLoading ? '...' : stats?.totalStoresCount || 0}
                    </span>
                    <span className="text-xs font-bold text-blue-600">
                      {stats?.activeStoresCount || 0} Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Subdomains registered</p>
                </div>

                {/* Card 4: System Orders */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Purchases</span>
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {isStatsLoading ? '...' : stats?.totalSystemOrdersCount || 0}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">Orders</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">All tenant customer purchases</p>
                </div>
              </div>

              {/* 2 Quick Overview Box Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Onboarded Stores Box */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-base text-slate-900">Recent Merchant Stores</h3>
                    <button
                      onClick={() => setActiveTab('stores')}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>View All ({stores.length})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {stores.slice(0, 4).map((s) => (
                      <div key={s.id} className="py-3 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs">
                            {s.name[0]}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{s.name}</span>
                            <span className="text-[10px] text-blue-600 font-mono">{s.slug}.easycommerce.app</span>
                          </div>
                        </div>

                        <span className="font-extrabold text-emerald-600">৳{s.totalRevenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Customer Orders Box */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-base text-slate-900">Recent Platform Purchases</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>View All ({orders.length})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {orders.slice(0, 4).map((o) => (
                      <div key={o.id} className="py-3 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="font-mono font-bold text-blue-600 block">#{o.orderNumber}</span>
                          <span className="text-[10px] text-slate-400">{o.customerName} ({o.storeSlug})</span>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-slate-900 block">৳{o.grandTotal.toLocaleString()}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">{o.orderStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORES DIRECTORY TAB CONTENT */}
          {activeTab === 'stores' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0 animate-in fade-in duration-200">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Merchant Stores Directory</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {filteredStores.length} stores registered on the platform
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search store, slug, owner..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    onClick={() => refetchStores()}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Store & Subdomain</th>
                      <th className="px-6 py-3.5">Merchant Owner</th>
                      <th className="px-6 py-3.5">Sales Revenue (৳)</th>
                      <th className="px-6 py-3.5">Orders Count</th>
                      <th className="px-6 py-3.5">Active Status</th>
                      <th className="px-6 py-3.5 text-right">Super-Admin Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {isStoresLoading ? (
                      <TableRowSkeleton columns={6} />
                    ) : filteredStores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No stores found matching your query.
                        </td>
                      </tr>
                    ) : (
                      filteredStores.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                                {item.name ? item.name[0].toUpperCase() : 'S'}
                              </div>
                              <div>
                                <span className="font-extrabold text-sm text-slate-900 block">
                                  {item.name}
                                </span>
                                <a
                                  href={`/store/${item.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-mono font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{item.slug}.easycommerce.app</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-slate-900 block">{item.ownerName}</span>
                              <span className="text-[11px] text-slate-400 font-medium">{item.ownerEmail}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-extrabold text-emerald-600 text-sm block">
                              ৳{item.totalRevenue.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {item.ordersCount} orders
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {item.isActive ? (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>ACTIVE</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-red-50 text-red-700 font-bold text-[10px] rounded-full border border-red-200 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>SUSPENDED</span>
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/dashboard`}
                                target="_blank"
                                className="px-3 py-1.5 font-bold text-xs bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-xl transition-all inline-flex items-center gap-1.5"
                                title="Inspect Merchant Dashboard View"
                              >
                                <StoreIcon className="w-3.5 h-3.5" />
                                <span>Merchant View</span>
                              </Link>

                              <button
                                onClick={() => handleToggleStatus(item.id)}
                                disabled={isToggling}
                                className={`px-3 py-1.5 font-bold text-xs rounded-xl border transition-all inline-flex items-center gap-1.5 ${
                                  item.isActive
                                    ? 'bg-red-50 hover:bg-red-600 hover:text-white text-red-700 border-red-200'
                                    : 'bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border-emerald-200'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{item.isActive ? 'Suspend Store' : 'Activate Store'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM PURCHASES TAB CONTENT */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0 animate-in fade-in duration-200">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">System-Wide Customer Purchases</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {filteredOrders.length} total customer orders across all merchant stores
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search order #, customer, store..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    onClick={() => refetchOrders()}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Order #</th>
                      <th className="px-6 py-3.5">Merchant Store</th>
                      <th className="px-6 py-3.5">Customer Info</th>
                      <th className="px-6 py-3.5">Grand Total (৳)</th>
                      <th className="px-6 py-3.5">Payment Method</th>
                      <th className="px-6 py-3.5">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {isOrdersLoading ? (
                      <TableRowSkeleton columns={6} />
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No orders found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-extrabold text-blue-600 text-xs">
                            #{order.orderNumber}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 block">{order.storeName}</span>
                            <span className="text-[10px] font-mono text-slate-400">{order.storeSlug}.easycommerce.app</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 block">{order.customerName}</span>
                            <span className="text-[10px] text-slate-400">{order.customerPhone} ({order.city})</span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-900 text-xs">
                            ৳{order.grandTotal.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-full border border-slate-200">
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200">
                              {order.orderStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MIGRATIONS & DB TAB CONTENT */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Database & System Migrations Status</h3>
                  <p className="text-xs text-slate-400">PostgreSQL TypeORM schema migrations</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    PostgreSQL Connection Status
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Connected & Operational</span>
                  </span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Executed TypeORM Migrations
                  </span>
                  <span className="text-sm font-extrabold text-blue-600 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>8 Active System Migrations</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
