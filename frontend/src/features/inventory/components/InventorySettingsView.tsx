'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Database,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  useGetInventorySettingsOverviewQuery,
  useSeedInventoryDemoDataMutation,
} from '../api/inventoryApi';

export function InventorySettingsView() {
  const { data: settingsData, isLoading, refetch } = useGetInventorySettingsOverviewQuery(undefined, {
    pollingInterval: 30000,
  });
  
  const overview = settingsData?.overview;
  const integrity = settingsData?.integrity;

  const [seedDemoData, { isLoading: isSeeding }] = useSeedInventoryDemoDataMutation();
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);
  const [seedErrorMessage, setSeedErrorMessage] = useState<string | null>(null);

  const handleSeedConfirm = async () => {
    setSeedSuccessMessage(null);
    setSeedErrorMessage(null);
    try {
      const res = await seedDemoData().unwrap();
      setShowSeedModal(false);
      setSeedSuccessMessage(
        `Successfully seeded ${res.productsCreated} products, ${res.variantsCreated} variants, ${res.inventoryStocksCreated} inventory items, and ${res.movementsCreated} movement ledger entries!`,
      );
      refetch();
    } catch (err: any) {
      setShowSeedModal(false);
      setSeedErrorMessage(
        err?.data?.message || err?.message || 'Failed to seed demo inventory records.',
      );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
            Development seed data, platform security guarantees, and live database invariant overview.
          </p>
        </div>
      </div>

      {/* Success / Error Feedback Banners */}
      {seedSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{seedSuccessMessage}</div>
        </div>
      )}

      {seedErrorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-xs font-medium animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{seedErrorMessage}</div>
        </div>
      )}

      {/* 2-Column Grid Layout for Screen 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Main Seed / Demo Data Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Seed / Demo Data</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Add realistic inventory data for testing and development. Generates catalog products, multi-level variants, stock distributions, and movement logs.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSeedModal(true)}
              disabled={isSeeding}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Seeding Demo Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Seed Demo Data</span>
                </>
              )}
            </button>
          </div>

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

      {/* Confirmation Modal for Demo Data Seed */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSeeding && setShowSeedModal(false)} />
          <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-extrabold text-slate-900">Seed Demo Data</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800 text-sm">
                <Database className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold">This will populate your database with dummy data.</p>
                  <p className="mt-1 text-xs text-blue-700/80">It is safe to run multiple times, but it will create many records.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowSeedModal(false)} disabled={isSeeding} className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button onClick={handleSeedConfirm} disabled={isSeeding} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-2">
                {isSeeding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Seeding...</span></>
                ) : (
                  <span>Confirm & Seed</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
