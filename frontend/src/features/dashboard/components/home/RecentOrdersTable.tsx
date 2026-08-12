'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { useGetMerchantOrdersQuery, Order } from '@/features/order/api/orderApi';
import { Skeleton } from '@/components/ui/Skeleton';

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
    case 'ON_HOLD':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CONFIRMED':
    case 'PROCESSING':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'SHIPPED':
    case 'DELIVERED':
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'CANCELLED':
    case 'RETURNED':
    case 'PAYMENT_FAILED':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function RecentOrdersTable() {
  const { data: orders = [], isLoading } = useGetMerchantOrdersQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900">Recent orders</h3>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 group"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">No orders yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Your first order will appear here when a customer purchases from your store.
          </p>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
          >
            View Store
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => {
                const date = new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-[13px] font-semibold text-slate-900">
                      <Link href={`/dashboard/orders/${order.id}`} className="hover:text-blue-600 hover:underline">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-slate-700">
                      {order.customerName || order.customerPhone}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-slate-500">
                      {date}
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-slate-900 text-right">
                      ৳{Number(order.grandTotal).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-slate-500">
                      {order.paymentMethod}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(order.orderStatus)}`}>
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
