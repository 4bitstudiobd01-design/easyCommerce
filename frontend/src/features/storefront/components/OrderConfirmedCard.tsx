'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { Order } from '@/features/order/api/orderApi';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';

interface OrderConfirmedCardProps {
  order: Order;
  storeName?: string;
  storeSlug: string;
  primaryColor: string;
  /** 'standard' = inside Dhaka, 'express' = outside Dhaka. */
  shippingMethod: 'standard' | 'express';
  paymentMethod: string;
}

/**
 * The post-checkout "Order Confirmed!" screen with the full line-item and totals
 * breakdown. Shared by CheckoutView (COD path) and the /checkout/review route.
 */
export function OrderConfirmedCard({
  order,
  storeName,
  storeSlug,
  primaryColor,
  shippingMethod,
  paymentMethod,
}: OrderConfirmedCardProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900" style={{ ['--brand' as any]: primaryColor }}>
      <ShopEaseNavbar
        storeName={storeName}
        slug={storeSlug || 'main'}
        primaryColor={primaryColor}
        activeTab="shop"
      />
      <CartDrawer primaryColor={primaryColor} />
      <div className="flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl max-w-lg w-full p-8 text-center space-y-6 mt-10">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Confirmed!</h1>
          <p className="text-xs text-slate-500">
            Thank you for your purchase{storeName ? ` from ${storeName}` : ''}. We have received your order.
          </p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-slate-500">Order Reference:</span>
            <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-bold text-slate-900">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment:</span>
            <span className="font-bold text-slate-900">{paymentMethod}</span>
          </div>

          {/* Ordered items */}
          {order.items?.length > 0 && (
            <div className="pt-2 mt-1 border-t border-slate-200 space-y-1.5">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between gap-3">
                  <span className="text-slate-600">
                    {it.productTitle}
                    {it.variantTitle ? ` (${it.variantTitle})` : ''}{' '}
                    <span className="text-slate-400">× {it.quantity}</span>
                  </span>
                  <span className="font-semibold text-slate-900 shrink-0">
                    ৳ {(Number(it.unitPrice) * it.quantity - Number(it.discountAmount || 0)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Totals breakdown */}
          <div className="pt-2 mt-1 border-t border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900">৳ {Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                Delivery charge{shippingMethod === 'express' ? ' (Outside Dhaka)' : ' (Inside Dhaka)'}
              </span>
              <span className="font-semibold text-slate-900">৳ {Number(order.deliveryFee).toLocaleString()}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">− ৳ {Number(order.discountAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-900">Grand Total</span>
              <span className="font-extrabold" style={{ color: primaryColor }}>
                ৳ {Number(order.grandTotal).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={storeSlug ? `/store/${storeSlug}` : '/'}
          className="w-full h-12 hover:brightness-110 text-white font-bold text-xs rounded-xl flex items-center justify-center transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          Continue Shopping
        </Link>
      </div>
      </div>
    </div>
  );
}
