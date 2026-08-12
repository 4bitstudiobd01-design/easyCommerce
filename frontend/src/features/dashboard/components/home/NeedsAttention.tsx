'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle2, ShoppingBag, Package, Truck } from 'lucide-react';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';
import { useGetInventoryStocksQuery } from '@/features/inventory/api/inventoryApi';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function NeedsAttention() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: response, isLoading: isOrdersLoading } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  const orders = response?.data || [];
  const { data: stocks = [], isLoading: isStocksLoading } = useGetInventoryStocksQuery(undefined, { skip: !store });

  const isLoading = isStoreLoading || isOrdersLoading || isStocksLoading;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-slate-900">Needs attention</h3>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // 1. Orders awaiting confirmation
  const pendingOrders = orders.filter(o => o.orderStatus === 'PENDING').length;

  // 2. Products low in stock
  const lowStockProducts = stocks.filter(s => s.isOutOfStock || s.isLowStock || (s.availableQuantity ?? s.quantityOnHand) <= s.reorderPoint).length;

  // 3. Courier not connected
  const hasCourier = Boolean(store?.steadfastApiKey || store?.pathaoClientId);

  const attentionItems = [];

  // For demo/development, if we want to ensure the UI shows up perfectly like the image when they have issues:
  if (pendingOrders > 0) {
    attentionItems.push({
      id: 'pending_orders',
      title: `${pendingOrders} orders awaiting confirmation`,
      subtitle: 'Review and confirm pending orders',
      actionLink: '/dashboard/orders?status=PENDING',
      Icon: ShoppingBag,
      colors: {
        bg: 'bg-red-50/40 hover:bg-red-50',
        border: 'border-red-100',
        iconBg: 'bg-red-100/50',
        iconColor: 'text-red-500',
        chevron: 'text-slate-500 group-hover:text-slate-700'
      }
    });
  }

  if (lowStockProducts > 0) {
    attentionItems.push({
      id: 'low_stock',
      title: `${lowStockProducts} products are low in stock`,
      subtitle: 'Restock to avoid missing sales',
      actionLink: '/dashboard/products',
      Icon: Package,
      colors: {
        bg: 'bg-amber-50/40 hover:bg-amber-50',
        border: 'border-amber-100/70',
        iconBg: 'bg-amber-100/50',
        iconColor: 'text-amber-500',
        chevron: 'text-amber-500 group-hover:text-amber-600'
      }
    });
  }

  if (!hasCourier && store) {
    attentionItems.push({
      id: 'no_courier',
      title: 'Courier is not connected',
      subtitle: 'Connect a courier to start shipping',
      actionLink: '/dashboard/settings',
      Icon: Truck,
      colors: {
        bg: 'bg-orange-50/40 hover:bg-orange-50',
        border: 'border-orange-100/70',
        iconBg: 'bg-orange-100/50',
        iconColor: 'text-orange-500',
        chevron: 'text-orange-500 group-hover:text-orange-600'
      }
    });
  }

  // To exactly match the design even if data is 0 for demo purposes, uncomment this block or rely on seeded data.
  // The user seeded data, so it should trigger naturally if there are pending orders etc.
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-slate-900">Needs attention</h3>
        <Link href="/dashboard/orders" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
          View all
        </Link>
      </div>

      {attentionItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center h-full flex-1">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-900">Everything looks good</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Your store has no outstanding issues that need attention.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {attentionItems.map((item) => (
            <Link 
              key={item.id} 
              href={item.actionLink}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors group ${item.colors.bg} ${item.colors.border}`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.colors.iconBg}`}>
                  <item.Icon className={`w-4 h-4 ${item.colors.iconColor}`} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold text-slate-800 tracking-tight">{item.title}</span>
                  <span className="text-[12px] text-slate-500 font-medium">{item.subtitle}</span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${item.colors.chevron}`} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
