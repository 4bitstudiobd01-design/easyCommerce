'use client';

import React from 'react';
import { Package, Layers, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import { InventoryKpiResponse } from '../api/inventoryApi';

interface InventoryKpiCardsProps {
  kpis?: InventoryKpiResponse;
  isLoading?: boolean;
}

export function InventoryKpiCards({ kpis, isLoading = false }: InventoryKpiCardsProps) {
  const cards = [
    {
      label: 'Total Inventory Items',
      value: kpis?.totalItems ?? 1248,
      icon: Package,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
      trend: '+11.2%',
      isPositive: true,
    },
    {
      label: 'Total Units',
      value: kpis?.totalUnits ?? 48520,
      icon: Layers,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
      trend: '+8%',
      isPositive: true,
    },
    {
      label: 'Low Stock',
      value: kpis?.lowStockCount ?? 24,
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-100',
      trend: '-40%',
      isPositive: false,
    },
    {
      label: 'Out of Stock',
      value: kpis?.outOfStockCount ?? 8,
      icon: XCircle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-100',
      trend: '-20%',
      isPositive: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, iconBg, iconColor, borderColor, trend, isPositive }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden"
        >
          {/* Top Row: Label + Help indicator */}
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-700 tracking-tight">{label}</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-400 cursor-help" />
          </div>

          {/* Middle Row: Big Number + Icon in squircle badge */}
          <div className="flex items-center justify-between mt-3">
            {isLoading ? (
              <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-xl" />
            ) : (
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {value.toLocaleString()}
              </span>
            )}

            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg} ${iconColor} ${borderColor}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>

          {/* Bottom Row: Trend pill */}
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
              )}
              <span>{trend}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
