'use client';

import React from 'react';
import { X, Phone, Mail, MapPin, Clock, MessageSquare, Loader2 } from 'lucide-react';
import type { AbandonedCart } from '../api/orderApi';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatTime,
  getAvatarTint,
  getCartStatus,
  getInitials,
  getItemTitle,
  STATUS_STYLES,
} from '../utils/abandonedCartFormatters';

interface AbandonedCartDetailsDrawerProps {
  cart: AbandonedCart | null;
  isSending: boolean;
  onClose: () => void;
  onSendSms: (cart: AbandonedCart) => void;
}

export const AbandonedCartDetailsDrawer = ({
  cart,
  isSending,
  onClose,
  onSendSms,
}: AbandonedCartDetailsDrawerProps) => {
  // Escape closes the drawer, matching the rest of the dashboard's drawers.
  React.useEffect(() => {
    if (!cart) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, onClose]);

  if (!cart) return null;

  const status = getCartStatus(cart);
  const statusStyle = STATUS_STYLES[status];
  const items = Array.isArray(cart.itemsJson) ? cart.itemsJson : [];

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Abandoned cart details"
        className="fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col"
      >
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-10 h-10 rounded-full ${getAvatarTint(cart.id)} flex items-center justify-center text-xs font-extrabold shrink-0`}
              aria-hidden="true"
            >
              {getInitials(cart.customerName)}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 truncate">
                {cart.customerName || 'Anonymous Customer'}
              </h2>
              <span
                className={`inline-flex mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusStyle.className}`}
              >
                {statusStyle.label}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart details"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* CONTACT */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Contact
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span className="truncate">{cart.customerPhone}</span>
              </li>
              {cart.customerEmail && (
                <li className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span className="truncate">{cart.customerEmail}</span>
                </li>
              )}
              {cart.shippingAddress && (
                <li className="flex items-start gap-2 text-xs font-medium text-slate-700">
                  <MapPin
                    className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{cart.shippingAddress}</span>
                </li>
              )}
            </ul>
          </section>

          {/* TIMELINE */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Timeline
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span>
                  Abandoned {formatDate(cart.createdAt)} at {formatTime(cart.createdAt)}
                  <span className="text-slate-400 ml-1">
                    ({formatRelativeTime(cart.createdAt)})
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <MessageSquare
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {cart.lastRemindedAt
                    ? `Last reminded ${formatDate(cart.lastRemindedAt)} (${formatRelativeTime(cart.lastRemindedAt)})`
                    : 'No recovery reminder sent yet'}
                </span>
              </li>
            </ul>
          </section>

          {/* ITEMS */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Cart Items ({items.length})
            </h3>
            {items.length === 0 ? (
              <p className="text-xs font-medium text-slate-400">
                No item details were captured for this cart.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                {items.map((item, index) => {
                  const record = item as Record<string, unknown>;
                  const quantity = Number(record?.quantity) || 1;
                  const price = Number(record?.price ?? record?.unitPrice);

                  return (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {getItemTitle(item)}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400">
                          Qty {quantity}
                        </p>
                      </div>
                      {Number.isFinite(price) && (
                        <span className="text-xs font-bold text-slate-900 shrink-0">
                          {formatCurrency(price * quantity)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* TOTAL */}
          <section className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-emerald-900">Cart Value</span>
            <span className="text-base font-extrabold text-emerald-700">
              {formatCurrency(cart.totalAmount)}
            </span>
          </section>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onSendSms(cart)}
            disabled={isSending || cart.isRecovered}
            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {cart.isRecovered
              ? 'Already Recovered'
              : isSending
                ? 'Sending...'
                : 'Send Recovery SMS'}
          </button>
        </div>
      </aside>
    </>
  );
};
