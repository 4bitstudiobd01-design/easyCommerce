'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, MoreVertical } from 'lucide-react';
import { useGetMerchantOrdersQuery, Order } from '@/features/order/api/orderApi';
import { Skeleton } from '@/components/ui/Skeleton';

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
    case 'ON_HOLD':
      return 'bg-amber-50 text-amber-600';
    case 'CONFIRMED':
    case 'PROCESSING':
      return 'bg-blue-50 text-blue-600';
    case 'SHIPPED':
      return 'bg-purple-50 text-purple-600';
    case 'DELIVERED':
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-600';
    case 'CANCELLED':
    case 'RETURNED':
    case 'PAYMENT_FAILED':
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-slate-50 text-slate-600';
  }
}

function getPaymentBadge(method: string) {
  if (method === 'COD') return 'bg-amber-50 text-amber-600';
  return 'bg-emerald-50 text-emerald-600';
}

function getAvatarColor(name: string) {
  const char = name.charAt(0).toUpperCase();
  if (['K','L','M','N','P'].includes(char)) return 'bg-pink-50 text-pink-600';
  if (['R','S','T','V','W'].includes(char)) return 'bg-emerald-50 text-emerald-600';
  if (['H','C','D','F','G'].includes(char)) return 'bg-amber-50 text-amber-600';
  return 'bg-blue-50 text-blue-600';
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase() || 'C';
}

export function RecentOrdersTable() {
  const { data: orders = [], isLoading } = useGetMerchantOrdersQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-[15px] font-bold text-slate-900">Recent orders</h3>
        <Link
          href="/dashboard/orders"
          className="text-[13px] font-semibold text-blue-600 hover:text-blue-700"
        >
          View all orders
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
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
        <div className="px-6 pb-6 overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[12px] font-semibold text-slate-500">
                <th className="px-4 py-3 font-semibold rounded-l-lg">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold rounded-r-lg w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {recentOrders.map((order) => {
                const dateObj = new Date(order.createdAt);
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const customerName = order.customerName || 'Guest';

                return (
                  <tr key={order.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-4 text-[13px] font-semibold text-blue-600">
                      <Link href={`/dashboard/orders/${order.id}`} className="hover:underline">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${getAvatarColor(customerName)}`}>
                          {getInitials(customerName)}
                        </div>
                        <span className="text-[13px] font-medium text-slate-700">{customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-slate-700">{dateStr}</span>
                        <span className="text-[11px] font-medium text-slate-500 mt-0.5">{timeStr}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-bold text-slate-900">
                      ৳{Number(order.grandTotal).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${getPaymentBadge(order.paymentMethod)}`}>
                        {order.paymentMethod === 'COD' ? 'COD' : 'Paid'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${getStatusBadge(order.orderStatus)}`}>
                        {order.orderStatus.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
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
