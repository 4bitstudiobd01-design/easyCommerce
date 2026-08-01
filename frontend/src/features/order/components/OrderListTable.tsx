'use client';

import React from 'react';
import { useGetMerchantOrdersQuery, useUpdateOrderStatusMutation, Order } from '../api/orderApi';
import {
  ShoppingCart,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

interface OrderListTableProps {
  onDispatchCourierClick?: (order: Order) => void;
}

export function OrderListTable({ onDispatchCourierClick }: OrderListTableProps) {
  const { data: orders = [], isLoading, refetch } = useGetMerchantOrdersQuery();
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    try {
      await updateOrderStatus({ id: orderId, orderStatus: newStatus }).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to update order status.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-3 w-32 bg-slate-200 animate-pulse rounded-lg" />
          </div>
          <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <table className="w-full text-left text-xs">
          <tbody>
            <TableRowSkeleton columns={8} />
            <TableRowSkeleton columns={8} />
            <TableRowSkeleton columns={8} />
          </tbody>
        </table>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">No Sales Orders Placed Yet</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Share your storefront link with customers to start receiving real-time purchases and invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900">Merchant Sales Orders</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {orders.length} purchases placed on your store
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
        >
          Refresh Orders
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Order ID</th>
              <th className="px-6 py-3.5">Customer Details</th>
              <th className="px-6 py-3.5">Delivery Address</th>
              <th className="px-6 py-3.5">Total Amount (৳)</th>
              <th className="px-6 py-3.5">Payment</th>
              <th className="px-6 py-3.5">Order Status</th>
              <th className="px-6 py-3.5">Courier Dispatch</th>
              <th className="px-6 py-3.5 text-right">Placed On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Order Number */}
                <td className="px-6 py-4">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm block">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {order.items?.length || 1} items
                    </span>
                  </div>
                </td>

                {/* Customer Details */}
                <td className="px-6 py-4">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {order.customerName}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{order.customerPhone}</span>
                    </span>
                  </div>
                </td>

                {/* Address */}
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex items-start gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{order.shippingAddress}, {order.city}</span>
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-4">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">
                      ৳{Number(order.grandTotal).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Fee: ৳{order.deliveryFee}
                    </span>
                  </div>
                </td>

                {/* Payment Method */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200 inline-block">
                      {order.paymentMethod}
                    </span>
                    <span
                      className={`block text-[10px] font-bold ${
                        order.paymentStatus === 'PAID'
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </td>

                {/* Status Dropdown */}
                <td className="px-6 py-4">
                  <select
                    value={order.orderStatus}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border focus:outline-none cursor-pointer transition-colors ${
                      order.orderStatus === 'CONFIRMED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : order.orderStatus === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.orderStatus === 'CANCELLED'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>

                {/* Dispatch Courier Button */}
                <td className="px-6 py-4">
                  {onDispatchCourierClick && (
                    <button
                      onClick={() => onDispatchCourierClick(order)}
                      disabled={order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED'}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-xl border border-blue-200/80 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{order.orderStatus === 'SHIPPED' ? 'Shipped' : 'Dispatch'}</span>
                    </button>
                  )}
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-right text-slate-400 text-[11px]">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
