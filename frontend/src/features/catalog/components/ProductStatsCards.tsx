'use client';

import React from 'react';
import { Package, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ProductStatsCardsProps {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  isLoading?: boolean;
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
}

export function ProductStatsCards({
  totalProducts,
  activeProducts,
  outOfStock,
  lowStock,
  isLoading = false,
}: ProductStatsCardsProps) {
  // Icon tints follow the same semantic palette the product table badges already use
  // (emerald = healthy, rose = out of stock, amber = low stock) so the page reads as
  // one system rather than introducing a second colour language.
  const cards: StatCard[] = [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: Package,
      iconClass: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: 'Active Products',
      value: activeProducts,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: 'Out of Stock',
      value: outOfStock,
      icon: XCircle,
      iconClass: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      label: 'Low Stock',
      value: lowStock,
      icon: AlertTriangle,
      iconClass: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, iconClass }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3.5"
        >
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${iconClass}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 truncate">{label}</p>
            {isLoading ? (
              <div className="h-6 w-16 bg-slate-200 animate-pulse rounded-lg mt-1" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {value.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
