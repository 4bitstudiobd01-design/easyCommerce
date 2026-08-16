'use client';

import React from 'react';
import {
  Mail,
  MessageSquare,
  Eye,
  Loader2,
  ShoppingCart,
  Phone,
  X,
  Package,
} from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import type { AbandonedCart } from '../api/orderApi';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatRelativeTime,
  getAvatarTint,
  getCartStatus,
  getInitials,
  getItemCount,
  getItemTitle,
  STATUS_STYLES,
} from '../utils/abandonedCartFormatters';

interface AbandonedCartTableProps {
  carts: AbandonedCart[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  sendingCartId: string | null;
  onClearFilters: () => void;
  onSendSms: (cart: AbandonedCart) => void;
  onViewCart: (cartId: string) => void;
}

/**
 * Compact item preview: the first two line items with miniature image or tinted icon,
 * then a "+N" overflow badge.
 */
const ItemChips = ({ items }: { items: unknown[] }) => {
  const list = Array.isArray(items) ? items : [];
  const visible = list.slice(0, 2);
  const overflow = list.length - visible.length;

  if (list.length === 0) {
    return <span className="text-[11px] font-medium text-slate-400">No items</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {visible.map((item, index) => {
        const record = item as Record<string, unknown>;
        const image = typeof record?.image === 'string' ? record.image : null;

        return image ? (
          <img
            key={index}
            src={image}
            alt={getItemTitle(item)}
            title={getItemTitle(item)}
            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <span
            key={index}
            title={getItemTitle(item)}
            className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"
          >
            <Package className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="text-[11px] font-bold text-slate-500 shrink-0">+{overflow}</span>
      )}
    </div>
  );
};

export const AbandonedCartTable = ({
  carts,
  isLoading,
  hasActiveFilters,
  sendingCartId,
  onClearFilters,
  onSendSms,
  onViewCart,
}: AbandonedCartTableProps) => {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRowSkeleton key={index} columns={7} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <ShoppingCart className="w-6 h-6 text-emerald-600" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold text-slate-900">
          {hasActiveFilters ? 'No carts match these filters' : 'No abandoned carts yet'}
        </p>
        <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
          {hasActiveFilters
            ? 'Try widening the date range or clearing the search to see more results.'
            : 'Carts appear here when a customer starts checkout but does not complete the order.'}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 inline-flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-slate-100 bg-slate-50/60">
          <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-4 py-3">Customer</th>
            <th scope="col" className="px-4 py-3">Items</th>
            <th scope="col" className="px-4 py-3 text-right">Cart Value</th>
            <th scope="col" className="px-4 py-3">Abandoned At</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Recovery Status</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {carts.map((cart) => {
            const status = getCartStatus(cart);
            const statusStyle = STATUS_STYLES[status];
            const isSending = sendingCartId === cart.id;
            const itemCount = getItemCount(cart.itemsJson);

            return (
              <tr key={cart.id} className="hover:bg-slate-50/70 transition-colors align-middle">
                {/* CUSTOMER */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-full ${getAvatarTint(cart.id)} flex items-center justify-center text-[11px] font-extrabold shrink-0 shadow-2xs`}
                      aria-hidden="true"
                    >
                      {getInitials(cart.customerName)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {cart.customerName || 'Anonymous Customer'}
                      </p>
                      {cart.customerEmail && (
                        <p className="text-[11px] font-medium text-slate-500 truncate">
                          {cart.customerEmail}
                        </p>
                      )}
                      <p className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" aria-hidden="true" />
                        {cart.customerPhone}
                      </p>
                    </div>
                  </div>
                </td>

                {/* ITEMS */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1">
                    <ItemChips items={cart.itemsJson} />
                    <span className="text-[10px] font-medium text-slate-400">
                      {itemCount} {itemCount === 1 ? 'unit' : 'units'}
                    </span>
                  </div>
                </td>

                {/* CART VALUE */}
                <td className="px-4 py-3.5 text-right">
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(cart.totalAmount)}
                  </span>
                </td>

                {/* ABANDONED AT */}
                <td className="px-4 py-3.5">
                  <p className="text-[11px] font-semibold text-slate-700">
                    {formatDate(cart.createdAt)}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {formatTime(cart.createdAt)} · {formatRelativeTime(cart.createdAt)}
                  </p>
                </td>

                {/* STATUS */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusStyle.className}`}
                  >
                    {statusStyle.label}
                  </span>
                </td>

                {/* RECOVERY */}
                <td className="px-4 py-3.5">
                  {cart.isRecovered ? (
                    <>
                      <p className="text-[11px] font-extrabold text-emerald-700">
                        {formatCurrency(cart.totalAmount)}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600">
                        Recovered & Converted 🎉
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {cart.lastRemindedAt
                          ? `Reminded ${formatRelativeTime(cart.lastRemindedAt)}`
                          : 'Not reminded yet'}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {cart.lastRemindedAt ? 'SMS Dispatched' : 'Ready for SMS'}
                      </p>
                    </>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSendSms(cart)}
                      disabled={isSending || cart.isRecovered}
                      title={
                        cart.isRecovered
                          ? 'This cart has already been recovered'
                          : 'Send recovery SMS'
                      }
                      aria-label={`Send recovery SMS to ${cart.customerName || cart.customerPhone}`}
                      className={`h-8 px-2.5 flex items-center justify-center rounded-lg border text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        cart.isRecovered
                          ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed'
                          : isSending
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                      }`}
                    >
                      {isSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      )}
                      {cart.isRecovered
                        ? 'Recovered'
                        : isSending
                          ? 'Sending...'
                          : cart.lastRemindedAt
                            ? 'Resend'
                            : 'Send SMS'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewCart(cart.id)}
                      title="View cart details"
                      aria-label={`View cart details for ${cart.customerName || cart.customerPhone}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
