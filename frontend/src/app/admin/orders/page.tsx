'use client';

import React, { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useGetAllSystemOrdersQuery } from '@/features/admin/api/adminApi';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: orders = [], isLoading: isOrdersLoading, refetch: refetchOrders } = useGetAllSystemOrdersQuery();

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      o.storeSlug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0 animate-in fade-in duration-200">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">System-Wide Customer Purchases</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredOrders.length} total customer orders across all merchant stores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, store..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            onClick={() => refetchOrders()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Order #</th>
              <th className="px-6 py-3.5">Merchant Store</th>
              <th className="px-6 py-3.5">Customer Info</th>
              <th className="px-6 py-3.5">Grand Total (৳)</th>
              <th className="px-6 py-3.5">Payment Method</th>
              <th className="px-6 py-3.5">Order Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {isOrdersLoading ? (
              <TableRowSkeleton columns={6} />
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No orders found matching your search.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono font-extrabold text-blue-600 text-xs">
                    #{order.orderNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 block">{order.storeName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{order.storeSlug}.bitcommerce.app</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 block">{order.customerName}</span>
                    <span className="text-[10px] text-slate-400">{order.customerPhone} ({order.city})</span>
                  </td>
                  <td className="px-6 py-4 font-extrabold text-slate-900 text-xs">
                    ৳{order.grandTotal.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-full border border-slate-200">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200">
                      {order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
