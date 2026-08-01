'use client';

import React from 'react';
import { Order } from '../api/orderApi';
import { X, Printer, ShieldCheck, Phone, MapPin, Building2 } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-8 relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-slate-900">Cash Memo Customer Invoice</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Cash Memo Invoice Document Area */}
        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-6 font-sans text-xs text-slate-800 print:p-0 print:border-none print:bg-white print:text-black">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight block">
                EasyCommerce Store
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">SaaS Multi-Tenant E-Commerce Platform</p>
            </div>
            <div className="text-right">
              <span className="font-mono font-extrabold text-sm text-blue-600 block">
                INVOICE #{order.orderNumber}
              </span>
              <span className="text-[11px] text-slate-400">
                Date: {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Customer & Shipping Information */}
          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-100 print:border-slate-300">
            <div>
              <span className="font-extrabold text-[10px] uppercase text-slate-400 block mb-1">
                Billed / Shipped To:
              </span>
              <span className="font-bold text-slate-900 text-sm block">{order.customerName}</span>
              <span className="text-slate-600 block">{order.customerPhone}</span>
              <span className="text-slate-600 block mt-0.5">{order.shippingAddress}, {order.city}</span>
            </div>

            <div className="text-right">
              <span className="font-extrabold text-[10px] uppercase text-slate-400 block mb-1">
                Payment Details:
              </span>
              <span className="font-bold text-slate-900 block">{order.paymentMethod}</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md border border-emerald-200 inline-block mt-1">
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-3">Product Description</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-semibold">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-bold text-slate-900">{item.productTitle}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{item.sku}</td>
                    <td className="p-3 text-center font-bold">{item.quantity}</td>
                    <td className="p-3 text-right">৳{item.unitPrice.toLocaleString()}</td>
                    <td className="p-3 text-right font-extrabold">৳{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">৳{order.subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Delivery Charge:</span>
                <span className="font-bold text-slate-900">৳{order.deliveryFee}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-blue-600">৳{order.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Thank you for shopping with us! For any customer queries, please retain this cash memo invoice.
          </div>
        </div>
      </div>
    </div>
  );
}
