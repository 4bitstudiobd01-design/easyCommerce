'use client';

import React from 'react';
import { Order } from '../api/orderApi';
import { useGetOrderInvoiceQuery } from '../api/orderApi';
import { useGetMyStoresQuery } from '@/features/tenant/api/tenantApi';
import { X, Printer, Loader2, Phone, MapPin, Globe, Store as StoreIcon } from 'lucide-react';
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../utils/paymentMethod';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

// Money columns arrive as numeric strings from the API (Postgres decimal), and an
// invoice must never silently print a blank or unformatted amount.
function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0.00';
  return amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const TERMS_AND_CONDITIONS =
  '1. This invoice is computer-generated and valid without a signature. 2. Returns accepted within 7 days of delivery in original condition. 3. For queries, contact the store using the details above.';

export function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  const { data: invoice, isLoading } = useGetOrderInvoiceQuery(order?.id ?? '', { skip: !isOpen || !order });
  const { data: stores = [] } = useGetMyStoresQuery();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const savedStoreId = typeof window !== 'undefined' ? localStorage.getItem('bitcommerce_active_store_id') : null;
  const activeStore = stores.find((s) => s.id === savedStoreId) || stores[0];

  const displayOrder = invoice?.order ?? order;
  const storeName = invoice?.storeName || activeStore?.name || 'BitCommerce Store';
  const storePhone = invoice?.storePhone && invoice.storePhone !== 'N/A' ? invoice.storePhone : activeStore?.phone;
  const storeAddress = invoice?.storeAddress && invoice.storeAddress !== 'N/A' ? invoice.storeAddress : activeStore?.address;
  const storeLogo = invoice?.storeLogo || activeStore?.logo;
  const storeDomain = invoice?.storeDomain || activeStore?.domain || activeStore?.slug;
  const balanceDue = invoice?.balanceDue ?? Number(displayOrder.grandTotal);
  const generatedAt = invoice?.generatedAt ? new Date(invoice.generatedAt) : new Date();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto print:rounded-none print:border-none print:shadow-none print:max-h-none print:max-w-none">
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-4 print:hidden sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900">Invoice</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
        ) : (
          /* Printable Invoice Document Area */
          <div className="p-8 font-sans text-slate-800 print:p-0">
            {/* Header: Store Branding with Logo, Name, Address & Contact */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                {/* Store Logo or Brand Badge */}
                {storeLogo ? (
                  <div className="w-14 h-14 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 shrink-0 shadow-xs flex items-center justify-center">
                    <img
                      src={storeLogo}
                      alt={storeName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                    {storeName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">{storeName}</h1>
                  
                  {storeAddress && (
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{storeAddress}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500 font-medium">
                    {storePhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{storePhone}</span>
                      </span>
                    )}

                    {storeDomain && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{storeDomain}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <h2 className="font-black text-3xl text-slate-900 tracking-tight">INVOICE</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Invoice# <span className="font-bold text-slate-900">{displayOrder.orderNumber}</span>
                </p>
              </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-8 py-6">
              <div>
                <p className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider mb-1.5">Bill To</p>
                <p className="font-bold text-slate-900 text-sm">{displayOrder.customerName}</p>
                {displayOrder.customerEmail && <p className="text-slate-500 text-xs mt-0.5">{displayOrder.customerEmail}</p>}
                <p className="text-slate-500 text-xs mt-0.5">{displayOrder.customerPhone}</p>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  {displayOrder.shippingAddress}, {displayOrder.city}
                </p>
              </div>
              <div>
                <p className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider mb-1.5">Ship To</p>
                <p className="font-bold text-slate-900 text-sm">{displayOrder.customerName}</p>
                <p className="text-slate-500 text-xs mt-0.5">{displayOrder.customerPhone}</p>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  {displayOrder.shippingAddress}, {displayOrder.city}
                </p>
              </div>
            </div>

            {/* Status Strip */}
            <div className="rounded-xl overflow-hidden border border-emerald-700 mb-6">
              <div className="grid grid-cols-4 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider">
                <div className="p-3">Invoice Date</div>
                <div className="p-3">Payment Method</div>
                <div className="p-3">Order Status</div>
                <div className="p-3">Payment Status</div>
              </div>
              <div className="grid grid-cols-4 bg-emerald-50 text-xs font-bold text-slate-800">
                <div className="p-3">{new Date(displayOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div className="p-3">{getPaymentMethodLabel(displayOrder.paymentMethod)}</div>
                <div className="p-3">{displayOrder.orderStatus.replace(/_/g, ' ')}</div>
                <div className="p-3">{getPaymentStatusLabel(displayOrder.paymentStatus, displayOrder.paymentMethod)}</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-xl overflow-hidden border border-slate-200 mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-700 text-white font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-3 w-8">#</th>
                    <th className="p-3">Item & Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayOrder.items?.map((item, index) => (
                    <tr key={item.id}>
                      <td className="p-3 text-slate-400 align-top">{index + 1}</td>
                      <td className="p-3 align-top">
                        <p className="font-bold text-slate-900">{item.productTitle}</p>
                        {item.sku && <p className="text-[10px] text-slate-400 mt-0.5">Variant: {item.sku}</p>}
                      </td>
                      <td className="p-3 text-center align-top">{item.quantity}</td>
                      <td className="p-3 text-right align-top">৳{formatMoney(item.unitPrice)}</td>
                      <td className="p-3 text-right align-top font-bold">৳{formatMoney(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer content: thanks note + summary */}
            <div className="flex items-start justify-between gap-8 mb-6">
              <p className="text-xs text-slate-500 italic mt-1">Thanks for your business. 🎉</p>

              <div className="w-64 space-y-1.5 text-xs shrink-0">
                <div className="flex justify-between text-slate-500">
                  <span>Sub Total</span>
                  <span className="font-bold text-slate-900">৳{formatMoney(displayOrder.subtotal)}</span>
                </div>
                {Number(displayOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Discount</span>
                    <span className="font-bold text-emerald-700">-৳{formatMoney(displayOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-slate-900">৳{formatMoney(displayOrder.deliveryFee)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>Total</span>
                  <span>৳{formatMoney(displayOrder.grandTotal)}</span>
                </div>
                <div className="bg-emerald-50 rounded-lg px-3 py-2 flex justify-between font-black text-sm text-emerald-700 mt-2">
                  <span>Balance Due</span>
                  <span>৳{formatMoney(balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="pt-4 border-t border-slate-200">
              <p className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider mb-1.5">Terms & Conditions</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{TERMS_AND_CONDITIONS}</p>
            </div>

            {/* Powered by footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
              {storeName} {storePhone ? `• ${storePhone}` : ''} • Generated {generatedAt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
