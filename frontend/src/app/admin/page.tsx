'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useGetAllStoresQuery, useGetAllSystemOrdersQuery } from '@/features/admin/api/adminApi';
import { DashboardRenderer } from '@/features/admin/components/core/DashboardRenderer';

export default function SuperAdminOverviewPage() {
  const { data: stores = [] } = useGetAllStoresQuery();
  const { data: orders = [] } = useGetAllSystemOrdersQuery();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 text-white shadow-xl shadow-blue-600/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/20 border border-white/30 rounded-full text-white text-xs font-bold mb-3 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SaaS Platform Control Panel</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Multi-Tenant Platform Control Center
            </h2>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">
              Manage all merchant organizations, subdomains, system-wide revenues, and store activation statuses from one unified interface.
            </p>
          </div>
        </div>
      </div>

      {/* DYNAMIC WIDGET REGISTRY RENDERER */}
      <DashboardRenderer />

      {/* 2 Quick Overview Box Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Onboarded Stores Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">Recent Merchant Stores</h3>
            <Link
              href="/admin/stores"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All ({stores.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
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
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">Recent Platform Purchases</h3>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
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
  );
}
