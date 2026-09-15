'use client';

import Link from 'next/link';
import { CheckCircle2, Image as ImageIcon } from 'lucide-react';
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
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl max-w-lg w-full p-8 space-y-6 mt-10">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Confirmed!</h1>
            <p className="text-xs text-slate-500">
              Thank you for your purchase{storeName ? ` from ${storeName}` : ''}. We have received your order.
            </p>
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs text-left overflow-hidden">
          <div className="p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Order reference</span>
              <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-bold text-slate-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment</span>
              <span className="font-bold text-slate-900">{paymentMethod}</span>
            </div>
          </div>

          {/* Ordered items */}
          {order.items?.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {it.productImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.productImageUrl} alt={it.productTitle} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 leading-snug line-clamp-2">{it.productTitle}</p>
                    {it.variantTitle && (
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{it.variantTitle}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ৳ {Number(it.unitPrice).toLocaleString()} × {it.quantity}
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-900 shrink-0">
                    ৳ {(Number(it.unitPrice) * it.quantity - Number(it.discountAmount || 0)).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Totals breakdown */}
          <div className="p-4 space-y-1.5">
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
