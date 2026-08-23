'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Order } from '../api/orderApi';
import {
  X,
  MapPin,
  Copy,
  CheckCircle2,
  Pencil,
  MoreHorizontal,
  Truck,
} from 'lucide-react';

interface OrderDetailPanelProps {
  order: Order | null;
  onClose: () => void;
  onConfirm?: (order: Order) => void;
  onBookCourier?: (order: Order) => void;
  isConfirming?: boolean;
}

// Money arrives as numeric strings from Postgres decimal columns.
function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  return amount.toLocaleString('en-BD');
}

// Kept in sync with the status colours used in the orders table.
function statusBadgeClass(status: string): string {
  switch (status) {
    case 'DELIVERED':
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700';
    case 'SHIPPED':
      return 'bg-violet-50 text-violet-700';
    case 'READY_TO_SHIP':
      return 'bg-sky-50 text-sky-700';
    case 'PROCESSING':
    case 'CONFIRMED':
      return 'bg-blue-50 text-blue-700';
    case 'CANCELLED':
    case 'RETURNED':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function OrderDetailPanel({
  order,
  onClose,
  onConfirm,
  onBookCourier,
  isConfirming,
}: OrderDetailPanelProps) {
  const isOpen = Boolean(order);

  // Portal target isn't available during SSR/first paint.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Close on Escape and lock background scroll while the drawer is open.
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // position:fixed (not just overflow:hidden) is needed to reliably stop
    // background scroll on mobile Safari, which otherwise still allows touch-scroll.
    const scrollY = window.scrollY;
    const body = document.body;
    const previousStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      body.style.position = previousStyles.position;
      body.style.top = previousStyles.top;
      body.style.left = previousStyles.left;
      body.style.right = previousStyles.right;
      body.style.overflow = previousStyles.overflow;
      window.scrollTo(0, scrollY);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!order || !mounted) return null;

  const consignment = order.consignment;
  const itemCount = order.items?.length ?? 0;
  const canConfirm = order.orderStatus === 'PENDING';

  // Once an order has left the fulfilment pipeline there is nothing left to edit
  // or ship, so those actions are hidden rather than shown and rejected server-side.
  const isTerminal = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'].includes(
    order.orderStatus,
  );
  const canEdit = ['PENDING', 'ON_HOLD', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus);
  const canBookCourier = !consignment && !isTerminal;

  const handleCopyAddress = () => {
    const address = [order.shippingAddress, order.area, order.city, order.district]
      .filter(Boolean)
      .join(', ');
    navigator.clipboard?.writeText(address);
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[1px] animate-backdrop-in"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Details for order ${order.orderNumber}`}
        className="fixed inset-y-0 right-0 z-[70] w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-drawer-in"
      >
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="min-w-0">
          <h3 className="text-base font-black text-slate-900 truncate">
            Order #{order.orderNumber}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusBadgeClass(
                order.orderStatus,
              )}`}
            >
              {order.orderStatus.replace(/_/g, ' ')}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
              {order.paymentMethod}
            </span>
            {consignment?.courierProvider && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                {consignment.courierProvider}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close order details"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 pb-4 border-b border-slate-100">
        {canConfirm && (
          <button
            type="button"
            disabled={isConfirming}
            onClick={() => onConfirm?.(order)}
            className="flex-1 px-3 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isConfirming ? 'Confirming…' : 'Confirm'}
          </button>
        )}
        {canEdit && (
          <Link
            href={`/dashboard/orders/${order.id}/edit`}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Order
          </Link>
        )}
        <Link
          href={`/dashboard/orders/${order.id}`}
          className={`px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors ${
            canConfirm || canEdit ? '' : 'flex-1'
          }`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
          {canConfirm || canEdit ? 'More' : 'View full order'}
        </Link>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Customer */}
        <section className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Customer</h4>
            <Link
              href={`/dashboard/customers?search=${encodeURIComponent(order.customerPhone)}`}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
            >
              View profile
            </Link>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-200">
                {initialsOf(order.customerName)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{order.customerName}</p>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-xs text-slate-500 hover:text-blue-600 hover:underline truncate block"
                >
                  {order.customerPhone}
                </a>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</p>
              <p className="text-base font-black text-slate-900">৳{formatMoney(order.grandTotal)}</p>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-start gap-1.5 text-xs text-slate-600 min-w-0">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span className="break-words">
                {[order.shippingAddress, order.area, order.city, order.district]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAddress}
              aria-label="Copy shipping address"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Placed At</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {new Date(order.createdAt).toLocaleString('en-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </section>

        {/* Items */}
        <section className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Order Items ({itemCount})
            </h4>
            <Link
              href={`/dashboard/orders/${order.id}`}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
            >
              Expand
            </Link>
          </div>

          {itemCount === 0 ? (
            <p className="text-xs text-slate-400">No items on this order.</p>
          ) : (
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.productTitle}</p>
                    {item.sku && (
                      <p className="text-[11px] text-slate-500 font-mono truncate">{item.sku}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-500">× {item.quantity}</p>
                    <p className="text-xs font-bold text-slate-900">
                      ৳{formatMoney(item.totalPrice)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Payment summary */}
        <section className="border border-slate-200 rounded-xl p-4">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
            Payment Summary
          </h4>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-bold text-slate-900">৳{formatMoney(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Delivery Charge</dt>
              <dd className="font-bold text-slate-900">৳{formatMoney(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-bold text-slate-900">৳{formatMoney(order.discountAmount)}</dd>
            </div>
            <div className="flex justify-between pt-2 mt-1 border-t border-slate-100">
              <dt className="font-black text-slate-900">Grand Total</dt>
              <dd className="font-black text-slate-900">৳{formatMoney(order.grandTotal)}</dd>
            </div>
            <div className="flex justify-between pt-2">
              <dt className="text-slate-500">Payment Method</dt>
              <dd className="font-bold text-slate-900">
                {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">Payment Status</dt>
              <dd>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                  {order.paymentStatus.replace(/_/g, ' ')}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        {/* Courier & delivery */}
        <section className="border border-slate-200 rounded-xl p-4">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
            Courier &amp; Delivery
          </h4>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between items-center gap-2">
              <dt className="text-slate-500">Courier</dt>
              <dd className="flex items-center gap-2">
                {consignment?.courierProvider ? (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {consignment.courierProvider}
                  </span>
                ) : (
                  <span className="text-slate-400">{isTerminal ? '—' : 'Not selected'}</span>
                )}
                {canBookCourier && onBookCourier && (
                  <button
                    type="button"
                    onClick={() => onBookCourier(order)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Truck className="w-3 h-3" />
                    Book Courier
                  </button>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Delivery Type</dt>
              <dd className="font-bold text-slate-900">Home Delivery</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {consignment?.status ?? 'Not Booked'}
                </span>
              </dd>
            </div>
            {consignment?.trackingCode && (
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Tracking</dt>
                <dd className="font-mono font-bold text-slate-900 truncate">
                  {consignment.trackingCode}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>
      </aside>
    </>,
    document.body,
  );
}
