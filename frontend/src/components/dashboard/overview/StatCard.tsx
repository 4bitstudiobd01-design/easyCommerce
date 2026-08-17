'use client';

import React from 'react';
import {
  Users,
  Store,
  ShoppingBag,
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
} from 'lucide-react';
import { KpiMetric } from '../types/dashboard.types';

interface StatCardProps {
  metric: KpiMetric;
}

export function StatCard({ metric }: StatCardProps) {
  const getIcon = () => {
    switch (metric.icon) {
      case 'users':
        return <Users className="w-4.5 h-4.5 text-emerald-600" />;
      case 'merchants':
        return <Store className="w-4.5 h-4.5 text-emerald-600" />;
      case 'stores':
        return <ShoppingBag className="w-4.5 h-4.5 text-emerald-600" />;
      case 'orders':
        return <FileText className="w-4.5 h-4.5 text-emerald-600" />;
      case 'gmv':
        return <Coins className="w-4.5 h-4.5 text-emerald-600" />;
      case 'mrr':
        return <CreditCard className="w-4.5 h-4.5 text-emerald-600" />;
      default:
        return <Users className="w-4.5 h-4.5 text-emerald-600" />;
    }
  };

  // Check if string is long (e.g. ৳4,80,00,000 or 128,420) to scale font gracefully on md/laptop viewports
  const isLongValue = metric.value.length > 8;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-4 2xl:p-5 shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-200 flex flex-col justify-between overflow-hidden min-w-0">
      {/* Top row: Icon & Metric Info */}
      <div className="flex items-start gap-2.5 sm:gap-3 mb-2 sm:mb-2.5 min-w-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50/90 border border-emerald-100/60 flex items-center justify-center shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 block truncate" title={metric.label}>
            {metric.label}
          </span>
          <div
            className={`font-extrabold text-gray-900 tracking-tight mt-0.5 tabular-nums whitespace-nowrap leading-tight ${
              isLongValue
                ? 'text-[14px] sm:text-[15.5px] lg:text-base xl:text-[14.5px] 2xl:text-[19px]'
                : 'text-base sm:text-lg lg:text-xl xl:text-base 2xl:text-2xl'
            }`}
            title={metric.value}
          >
            {metric.value}
          </div>
        </div>
      </div>

      {/* Bottom row: Trend indicator */}
      <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-gray-50/60 sm:border-t-0 sm:pt-0">
        <span
          className={`inline-flex items-center font-semibold text-[10.5px] sm:text-xs shrink-0 ${
            metric.isPositive ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {metric.isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
          )}
          {metric.change}
        </span>
        <span className="text-gray-400 text-[10px] sm:text-[11px] font-normal truncate">
          {metric.changePeriod}
        </span>
      </div>
    </div>
  );
}
