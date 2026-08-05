import React from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';

export interface OrdersOverviewData {
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface OrdersOverviewWidgetProps {
  data?: OrdersOverviewData;
  isLoading?: boolean;
  isError?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultOrdersData: OrdersOverviewData = {
  todayOrders: 342,
  pendingOrders: 58,
  completedOrders: 264,
  cancelledOrders: 20,
};

export function OrdersOverviewWidget({
  data = defaultOrdersData,
  isLoading = false,
  isError = false,
  lastUpdated,
  onRefresh,
  className = '',
}: OrdersOverviewWidgetProps) {
  return (
    <WidgetCard
      title="System Purchases Overview"
      subtitle="Cross-tenant daily order status"
      icon={ShoppingCart}
      iconBgColor="bg-indigo-50 dark:bg-indigo-950/50"
      iconTextColor="text-indigo-600 dark:text-indigo-400"
      isLoading={isLoading}
      isError={isError}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Today</span>
            <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white block">
            {data.todayOrders.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">Total Orders</span>
        </div>

        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-amber-700 dark:text-amber-300 block">
            {data.pendingOrders.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70 font-medium block">Processing</span>
        </div>

        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Completed</span>
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 block">
            {data.completedOrders.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 font-medium block">Delivered</span>
        </div>

        <div className="p-3.5 bg-red-50/50 dark:bg-red-950/30 rounded-2xl border border-red-100 dark:border-red-900/40 space-y-1">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Cancelled</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-black text-red-700 dark:text-red-300 block">
            {data.cancelledOrders.toLocaleString()}
          </span>
          <span className="text-[10px] text-red-600/80 dark:text-red-400/70 font-medium block">Returned/Failed</span>
        </div>
      </div>
    </WidgetCard>
  );
}
