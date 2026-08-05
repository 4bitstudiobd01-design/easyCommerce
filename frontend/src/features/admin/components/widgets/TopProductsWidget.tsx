'use client';

import React from 'react';
import { Package, TrendingUp } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';

export interface TopProductItem {
  id: string;
  name: string;
  category: string;
  revenueBdt: number;
  ordersCount: number;
  conversionRatePercent: number;
}

export interface TopProductsWidgetProps {
  products?: TopProductItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultProducts: TopProductItem[] = [
  { id: '1', name: 'Premium Cotton Panjabi', category: 'Men Fashion', revenueBdt: 450000, ordersCount: 320, conversionRatePercent: 4.8 },
  { id: '2', name: 'Handcrafted Clay Dinner Set', category: 'Home & Crafts', revenueBdt: 380000, ordersCount: 190, conversionRatePercent: 3.9 },
  { id: '3', name: 'Organza Embroidery Sharee', category: 'Women Boutique', revenueBdt: 310000, ordersCount: 140, conversionRatePercent: 3.5 },
  { id: '4', name: 'Custom Chocolate Gift Box', category: 'Bakery & Sweets', revenueBdt: 240000, ordersCount: 280, conversionRatePercent: 5.2 },
];

export function TopProductsWidget({
  products = defaultProducts,
  isLoading = false,
  isError = false,
  error,
  lastUpdated,
  onRefresh,
  className = '',
}: TopProductsWidgetProps) {
  return (
    <WidgetCard
      title="Top Selling Products Platform-Wide"
      subtitle="Highest revenue catalog items across all stores"
      icon={Package}
      iconBgColor="bg-blue-50 dark:bg-blue-950/50"
      iconTextColor="text-blue-600 dark:text-blue-400"
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={!products || products.length === 0}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {products.map((product, idx) => (
          <div key={product.id} className="py-3 flex items-center justify-between gap-3 text-xs font-semibold first:pt-0 last:pb-0">
            <div className="flex items-center gap-3 truncate">
              <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-blue-200/50 dark:border-blue-900">
                #{idx + 1}
              </div>
              <div className="truncate">
                <span className="font-extrabold text-slate-900 dark:text-white block truncate">{product.name}</span>
                <span className="text-[10px] text-slate-400 font-medium block truncate">{product.category}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                ৳{product.revenueBdt.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                {product.ordersCount} sales ({product.conversionRatePercent}% CVR)
              </span>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
