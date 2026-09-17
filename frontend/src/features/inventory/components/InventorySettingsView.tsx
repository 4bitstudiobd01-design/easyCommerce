'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useGetInventorySettingsOverviewQuery } from '../api/inventoryApi';

export function InventorySettingsView() {
  const router = useRouter();
  const { data: settingsData, isLoading } = useGetInventorySettingsOverviewQuery(undefined, {
    pollingInterval: 30000,
  });

  const overview = settingsData?.overview;
  const integrity = settingsData?.integrity;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <span>&gt;</span>
            <Link href="/dashboard/inventory" className="hover:text-slate-600 transition-colors">
              Inventory
            </Link>
            <span>&gt;</span>
            <span className="text-slate-700 font-semibold">Settings</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform security guarantees and live database invariant overview.
          </p>
        </div>
      </div>

      {/* 2-Column Grid Layout for Screen 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Live Data Overview Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Data Overview</h3>
                <p className="text-xs text-slate-400">Live authoritative counts from your database.</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-200 text-[11px] font-bold text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Database Synced</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50/75 rounded-2xl border border-slate-200/60 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Products</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                  {isLoading || !overview ? '...' : overview.totalProducts}
                </span>
              </div>
              <div className="p-4 bg-slate-50/75 rounded-2xl border border-slate-200/60 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variants</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                  {isLoading || !overview ? '...' : overview.totalVariants}
                </span>
              </div>
              <div className="p-4 bg-slate-50/75 rounded-2xl border border-slate-200/60 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Items</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                  {isLoading || !overview ? '...' : overview.totalInventoryItems}
                </span>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">In Stock</span>
                <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                  {isLoading || !overview ? '...' : overview.inStockItems}
                </span>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Low Stock</span>
                <span className="text-xl font-extrabold text-amber-700 mt-1 block">
                  {isLoading || !overview ? '...' : overview.lowStockItems}
                </span>
              </div>
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Out of Stock</span>
                <span className="text-xl font-extrabold text-rose-700 mt-1 block">
                  {isLoading || !overview ? '...' : overview.outOfStockItems}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Settings */}
        <div className="space-y-6">
          {/* Security & Validation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Security &amp; Validation</h3>
                <p className="text-xs text-slate-400">Strict platform invariants enforced at API &amp; DB layers.</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Stock Validation</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Enforced</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Prevents negative physical stock and validates sellable boundaries.</p>
                </div>
                {/* iOS Style Toggle (Checked) */}
                <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Immutable Ledger</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Enforced</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Every adjustment generates an append-only historical audit record.</p>
                </div>
                <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Tenant Isolation</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Enforced</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Strict row-level multi-tenant boundaries prevent data leakage.</p>
                </div>
                <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Operational Policies */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Advanced Settings</h3>
                <p className="text-xs text-slate-400">Inventory automation and bulk execution controls.</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Auto Update Status</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Continuously calculates In Stock/Low Stock based on threshold levels.</p>
                </div>
                <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Bulk Stock Operations</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Transactional multi-item stock adjustments with live projections.</p>
                </div>
                <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>

              {integrity && (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200/70">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span>Data Integrity Status</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200/80 text-emerald-800">
                        {integrity.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      {integrity.violationCount === 0
                        ? 'All inventory stocks and movement chains are mathematically consistent.'
                        : `${integrity.violationCount} data integrity violation(s) detected.`}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
