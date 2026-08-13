'use client';

import React, { useState } from 'react';
import {
  useGetMerchantAbandonedCartsQuery,
  useSendRecoverySmsMutation,
  AbandonedCart,
} from '../api/orderApi';
import { ShoppingCart, Send, RefreshCw, Clock, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

export function AbandonedCartsTable() {
  const { data: carts = [], isLoading, refetch } = useGetMerchantAbandonedCartsQuery();
  const [sendRecoverySms, { isLoading: isSending }] = useSendRecoverySmsMutation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendSms = async (cart: AbandonedCart) => {
    try {
      await sendRecoverySms(cart.id).unwrap();
      toast.success(`1-Click Recovery SMS sent to ${cart.customerPhone}!`);
      refetch();
    } catch (err: any) {
      toast.error('Failed to send recovery SMS.');
    }
  };

  const filteredCarts = carts.filter(
    (c) =>
      c.customerPhone.includes(searchQuery) ||
      (c.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER & TOP METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Abandoned Checkouts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Recover lost revenue by sending 1-click checkout recovery links to customers via SMS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-xs text-blue-900">
              {carts.length} Incomplete Carts
            </span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-sm"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ABANDONED CARTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-bold">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Cart Items</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4 text-center">Last Reminded</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCarts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                    No abandoned carts found. All customers are completing their checkouts! 🎉
                  </td>
                </tr>
              ) : (
                filteredCarts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {cart.customerName || 'Anonymous Customer'}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>{cart.customerPhone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {cart.itemsJson && cart.itemsJson.length > 0 ? (
                          cart.itemsJson.map((item: any, idx: number) => (
                            <div key={idx} className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span>{item.title || item.productTitle} × {item.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400">Cart items details</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-extrabold text-slate-900 text-sm">
                      ৳{Number(cart.totalAmount).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-center text-slate-500">
                      {cart.lastRemindedAt ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                          {new Date(cart.lastRemindedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not reminded yet</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSendSms(cart)}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-700/20 inline-flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Recovery SMS</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
