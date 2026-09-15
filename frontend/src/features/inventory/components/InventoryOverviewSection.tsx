'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Package,
  Clock,
  TrendingUp,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { InventoryKpiResponse, useGetInventoryHistoryQuery } from '../api/inventoryApi';

interface InventoryOverviewSectionProps {
  kpis?: InventoryKpiResponse;
  isLoadingKpis?: boolean;
}

export function InventoryOverviewSection({
  kpis,
  isLoadingKpis = false,
}: InventoryOverviewSectionProps) {
  const { data: historyResponse, isLoading: isLoadingHistory } = useGetInventoryHistoryQuery({
    params: { limit: 5 },
  });

  const totalItems = kpis?.totalItems ?? 0;
  const inStock = kpis?.inStockCount ?? (kpis ? kpis.totalItems - kpis.lowStockCount - kpis.outOfStockCount : 0);
  const lowStock = kpis?.lowStockCount ?? 0;
  const outOfStock = kpis?.outOfStockCount ?? 0;

  // Compute Donut SVG parameters
  const effectiveTotal = Math.max(totalItems, inStock + lowStock + outOfStock, 1);
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12

  const inStockPct = inStock / effectiveTotal;
  const lowStockPct = lowStock / effectiveTotal;
  const outOfStockPct = outOfStock / effectiveTotal;

  const inStockDash = inStockPct * circumference;
  const lowStockDash = lowStockPct * circumference;
  const outOfStockDash = outOfStockPct * circumference;

  // Offsets for sequential arcs
  const inStockOffset = 0;
  const lowStockOffset = -inStockDash;
  const outOfStockOffset = -(inStockDash + lowStockDash);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Just now';
      if (diffHrs === 1) return '1 hour ago';
      if (diffHrs < 24) return `${diffHrs} hours ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    } catch {
      return 'Recently';
    }
  };

  const formatMovementType = (type: string) => {
    switch (type) {
      case 'IN':
      case 'PURCHASE_RECEIPT':
      case 'INITIAL_STOCK':
        return { label: 'Stock Received', color: 'text-emerald-600' };
      case 'OUT':
      case 'ORDER_FULFILLMENT':
        return { label: 'Stock Out', color: 'text-slate-700' };
      case 'DAMAGE':
      case 'LOSS':
        return { label: 'Damaged / Removed', color: 'text-rose-600' };
      case 'ADJUSTMENT':
      case 'RECONCILIATION':
      default:
        return { label: 'Stock Adjusted', color: 'text-amber-700' };
    }
  };

  const rawHistoryItems = historyResponse?.data || [];
  const displayActivities = rawHistoryItems.slice(0, 5).map((item) => {
    const typeMeta = formatMovementType(item.type);
    const deltaNum = item.quantityDelta ?? 0;
    const deltaStr = deltaNum > 0 ? `+${deltaNum}` : `${deltaNum}`;

    const deltaColor = deltaNum > 0 ? 'text-emerald-600' : deltaNum < 0 ? 'text-rose-600' : 'text-slate-600';
    return {
      id: item.id,
      productName: item.product?.name || 'Product',
      variantTitle: item.variant?.title,
      productThumbnail: item.product?.thumbnail,
      typeLabel: typeMeta.label,
      typeColor: typeMeta.color,
      quantityDelta: deltaStr,
      quantityColor: deltaColor,
      timeAgo: formatTimeAgo(item.createdAt),
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Recent Inventory Activity */}
      <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Recent Inventory Activity
            </h2>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 px-4">Type</th>
                  <th className="pb-3 px-4">Quantity</th>
                  <th className="pb-3 pl-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingHistory && displayActivities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-xs text-slate-400">
                      Loading recent activity…
                    </td>
                  </tr>
                )}
                {!isLoadingHistory && displayActivities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      <Package className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500">No recent inventory activity yet</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Stock receipts and adjustments will show up here.
                      </p>
                    </td>
                  </tr>
                )}
                {displayActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Product Cell */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {act.productThumbnail ? (
                            <Image
                              src={act.productThumbnail}
                              alt={act.productName}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {act.productName}
                          </p>
                          {act.variantTitle && (
                            <p className="text-[10px] text-slate-400 truncate">
                              {act.variantTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type Cell */}
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-bold ${act.typeColor}`}>
                        {act.typeLabel}
                      </span>
                    </td>

                    {/* Quantity Cell */}
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-extrabold ${act.quantityColor}`}>
                        {act.quantityDelta}
                      </span>
                    </td>

                    {/* Time Cell */}
                    <td className="py-3.5 pl-4 text-right">
                      <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        {act.timeAgo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Footer Link */}
        <div className="pt-4 border-t border-slate-100 mt-2">
          <Link
            href="/dashboard/inventory/history"
            className="text-blue-600 hover:text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors group"
          >
            <span>View all activity</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Right Column: Stock Status Donut Chart */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Stock Status</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live
            </span>
          </div>

          {/* SVG Donut Chart */}
          <div className="relative flex items-center justify-center my-4">
            <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-[-90deg]">
              {/* Background Track */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth="16"
              />

              {/* In Stock Segment (Green) */}
              {inStockDash > 0 && (
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeDasharray={`${inStockDash} ${circumference}`}
                  strokeDashoffset={inStockOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              )}

              {/* Low Stock Segment (Amber) */}
              {lowStockDash > 0 && (
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="16"
                  strokeDasharray={`${lowStockDash} ${circumference}`}
                  strokeDashoffset={lowStockOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              )}

              {/* Out of Stock Segment (Rose) */}
              {outOfStockDash > 0 && (
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="16"
                  strokeDasharray={`${outOfStockDash} ${circumference}`}
                  strokeDashoffset={outOfStockOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              )}
            </svg>

            {/* Donut Center Number & Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {totalItems.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total items
              </span>
            </div>
          </div>

          {/* Breakdown Legend Rows */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 mt-4">
            {/* In Stock Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-slate-700">In Stock</span>
              </div>
              <span className="font-extrabold text-slate-900">{inStock.toLocaleString()}</span>
            </div>

            {/* Low Stock Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="font-bold text-slate-700">Low Stock</span>
              </div>
              <span className="font-extrabold text-slate-900">{lowStock.toLocaleString()}</span>
            </div>

            {/* Out of Stock Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="font-bold text-slate-700">Out of Stock</span>
              </div>
              <span className="font-extrabold text-slate-900">{outOfStock.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
