'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';
import { useGetInventoryStocksQuery } from '@/features/inventory/api/inventoryApi';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function NeedsAttention() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: orders = [], isLoading: isOrdersLoading } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  const { data: stocks = [], isLoading: isStocksLoading } = useGetInventoryStocksQuery(undefined, { skip: !store });

  const isLoading = isStoreLoading || isOrdersLoading || isStocksLoading;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
        <h3 className="text-[15px] font-bold text-slate-900 mb-4">Needs attention</h3>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
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

  if (pendingOrders > 0) {
    attentionItems.push({
      id: 'pending_orders',
      message: `${pendingOrders} order${pendingOrders === 1 ? '' : 's'} awaiting confirmation`,
      color: 'bg-red-500',
      actionText: 'View orders',
      actionLink: '/dashboard/orders?status=PENDING',
    });
  }

  if (lowStockProducts > 0) {
    attentionItems.push({
      id: 'low_stock',
      message: `${lowStockProducts} product${lowStockProducts === 1 ? ' is' : 's are'} low in stock`,
      color: 'bg-amber-500',
      actionText: 'Manage inventory',
      actionLink: '/dashboard/products',
    });
  }

  if (!hasCourier && store) {
    attentionItems.push({
      id: 'no_courier',
      message: 'Courier is not connected',
      color: 'bg-amber-500',
      actionText: 'Connect courier',
      actionLink: '/dashboard/settings',
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-[15px] font-bold text-slate-900 mb-4">Needs attention</h3>

      {attentionItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center h-full">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-900">Everything looks good</p>
          <p className="text-xs text-slate-500 mt-1">Your store has no outstanding issues.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {attentionItems.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${item.color}`}></span>
              <div>
                <p className="text-[13px] font-medium text-slate-900 leading-tight">
                  {item.message}
                </p>
                <Link
                  href={item.actionLink}
                  className="inline-flex items-center gap-1 mt-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:underline group"
                >
                  {item.actionText}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
