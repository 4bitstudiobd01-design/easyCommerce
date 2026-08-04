'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { useGetProductsQuery } from '@/features/catalog/api/catalogApi';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';
import { ProductListTable } from '@/features/catalog/components/ProductListTable';
import { RevenueChart } from '@/features/analytics/components/RevenueChart';
import { TopProductsCard } from '@/features/analytics/components/TopProductsCard';
import { Sparkles, Plus, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardOverviewPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const {
    data: store,
    refetch: refetchStore,
  } = useGetMyStoreQuery();

  const { data: products = [] } = useGetProductsQuery(undefined, { skip: !store });
  const { data: orders = [] } = useGetMerchantOrdersQuery(undefined, { skip: !store });

  const totalSales = orders.reduce((acc, order) => acc + Number(order.grandTotal), 0);
  const activeCustomersCount = orders.length > 0 ? new Set(orders.map(o => o.customerPhone)).size : 0;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const themePayment = params.get('theme_payment');
      if (themePayment === 'success') {
        if (store) {
          try {
            refetchStore();
          } catch (e) {}
        }
        toast.success(`🎉 Payment Successful via SSLCommerz! Premium Theme unlocked and activated.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push('/dashboard/themes');
      } else if (themePayment === 'failed' || themePayment === 'cancelled') {
        toast.error(`Payment ${themePayment}. Theme unlock was not completed.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push('/dashboard/themes');
      }
    }
  }, [store, router, refetchStore]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-8 border border-slate-800 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/30 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Welcome Back, {user?.fullName || 'Store Owner'}!</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {store?.name ? `${store.name} Control Center` : 'Merchant Control Center'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Your store is live on <span className="text-blue-400 font-semibold">{store?.slug ? `${store.slug}.easycommerce.app` : 'EasyCommerce'}</span>. Manage catalog items, orders, and multi-tenant settings in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => router.push('/dashboard/products/create')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Sales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">৳{totalSales.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-600">Revenue</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Currency: {store?.currency || 'BDT (৳)'}</p>
        </div>

        {/* Card 2: Orders */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Orders</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{orders.length}</span>
            <span className="text-xs font-bold text-blue-600">Active</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Completed & pending purchases</p>
        </div>

        {/* Card 3: Active Products */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Products</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{products.length}</span>
            <span className="text-xs font-bold text-indigo-600">Catalog</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Decoupled stock modeling</p>
        </div>

        {/* Card 4: Store Customers */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Store Customers</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{activeCustomersCount}</span>
            <span className="text-xs font-bold text-emerald-600">Isolated</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Row-level security context</p>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart & Top Selling Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RevenueChart />
        </div>
        <div className="lg:col-span-4">
          <TopProductsCard />
        </div>
      </div>

      {/* Product List Table Section */}
      <div className="space-y-4">
        <ProductListTable onAddProductClick={() => router.push('/dashboard/products/create')} />
      </div>
    </div>
  );
}
