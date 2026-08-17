'use client';

import React from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Loader2,
  Package,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import type { AbandonedCart } from '../api/orderApi';
import {
  formatCurrency,
  formatRelativeTime,
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
  // Escape closes the drawer
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

  const timeline: { time: string; title: string; description: string; type: 'cart_created' | 'sms_sent' | 'recovered' }[] = [
    {
      time: cart.createdAt,
      title: 'Cart Abandoned',
      description: `Checkout left incomplete with ${items.length} item${items.length === 1 ? '' : 's'} in cart`,
      type: 'cart_created',
    },
  ];
  if (cart.lastRemindedAt) {
    timeline.push({
      time: cart.lastRemindedAt,
      title: 'Recovery SMS Sent',
      description: `Reminder dispatched to ${cart.customerPhone}`,
      type: 'sms_sent',
    });
  }
  if (cart.isRecovered) {
    timeline.push({
      time: cart.lastRemindedAt || cart.createdAt,
      title: 'Cart Recovered',
      description: 'Customer completed the order',
      type: 'recovered',
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Abandoned cart details"
        className="fixed top-0 right-0 h-screen w-full sm:w-[460px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out"
      >
        {/* 1. HEADER */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-11 h-11 rounded-2xl ${getAvatarTint(cart.id)} flex items-center justify-center text-xs font-black shrink-0 shadow-2xs`}
              aria-hidden="true"
            >
              {getInitials(cart.customerName)}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 truncate">
                {cart.customerName || 'Anonymous Customer'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${statusStyle.className}`}
                >
                  {statusStyle.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ID: {cart.id}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart details"
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* 2. SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* CUSTOMER CONTACT & SHIPPING */}
          <section className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Customer Contact & Address
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{cart.customerPhone}</span>
              </li>
              {cart.customerEmail && (
                <li className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{cart.customerEmail}</span>
                </li>
              )}
              {cart.shippingAddress && (
                <li className="flex items-start gap-2 text-xs font-medium text-slate-700">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="leading-snug">{cart.shippingAddress}</span>
                </li>
              )}
            </ul>
          </section>

          {/* CART ITEMS BREAKDOWN */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Cart Items ({items.length})
              </h3>
              <span className="text-[10px] font-bold text-slate-500">
                Total Value: {formatCurrency(cart.totalAmount)}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                No items recorded in this cart session.
              </p>
            ) : (
              <div className="border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {items.map((item, index) => {
                  const record = item as Record<string, unknown>;
                  const quantity = Number(record?.quantity) || 1;
                  const price = Number(record?.price ?? record?.unitPrice) || 0;
                  const image = typeof record?.image === 'string' ? record.image : null;

                  return (
                    <div key={index} className="p-3.5 flex items-center gap-3 bg-white">
                      {image ? (
                        <img
                          src={image}
                          alt={getItemTitle(item)}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                          {getItemTitle(item)}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {formatCurrency(price)} × {quantity}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-900">
                          {formatCurrency(price * quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CART VALUE SUMMARY BOX */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900">
                Potential Revenue At Stake
              </span>
              <span className="text-lg font-black text-emerald-800">
                {formatCurrency(cart.totalAmount)}
              </span>
            </div>
          </section>

          {/* TIMELINE & ACTIVITY MILESTONES */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Activity Timeline & Journey
            </h3>

            <div className="relative pl-5 border-l-2 border-slate-200 space-y-4 py-1">
              {timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                      step.type === 'recovered'
                        ? 'bg-emerald-500 ring-2 ring-emerald-200'
                        : step.type === 'sms_sent'
                          ? 'bg-teal-500'
                          : 'bg-slate-400'
                    }`}
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{step.title}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatRelativeTime(step.time)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RECOVERY LINK TOKEN */}
          <section className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Direct Recovery URL
              </span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <Share2 className="w-3 h-3" /> Auto-Restores Cart
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-600 truncate bg-white p-2 rounded-lg border border-slate-200 select-all">
              https://bitcommerce.store/cart/recover?token={cart.recoveryToken}
            </p>
          </section>
        </div>

        {/* 3. FOOTER ACTIONS */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => onSendSms(cart)}
            disabled={isSending || cart.isRecovered}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : cart.isRecovered ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            {cart.isRecovered
              ? 'Cart Already Converted & Recovered'
              : isSending
                ? 'Dispatching SMS via Greenweb...'
                : 'Send Recovery SMS Reminder'}
          </button>
        </div>
      </aside>
    </>
  );
};
