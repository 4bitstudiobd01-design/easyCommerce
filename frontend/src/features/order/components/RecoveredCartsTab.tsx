'use client';

import React from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
  Phone,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import type { MockAbandonedCart } from '../data/abandonedCartMockData';
import { MOCK_RECOVERY_ANALYTICS } from '../data/abandonedCartMockData';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getAvatarTint,
  getInitials,
  getItemCount,
} from '../utils/abandonedCartFormatters';

interface RecoveredCartsTabProps {
  carts: MockAbandonedCart[];
  onViewCart: (cartId: string) => void;
}

export const RecoveredCartsTab: React.FC<RecoveredCartsTabProps> = ({
  carts,
  onViewCart,
}) => {
  const recoveredCarts = carts.filter((c) => c.isRecovered);
  const totalRecovered = recoveredCarts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. TOP HIGHLIGHT STATS BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Total Recovered
            </span>
            <span className="p-1.5 rounded-lg bg-white/20 text-white">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black">{formatCurrency(totalRecovered)}</h3>
            <p className="text-[11px] text-emerald-100 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +34.8% vs previous 30 days
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recovered Carts
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{recoveredCarts.length} Carts</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              From total reminders sent
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg. Recovery Speed
            </span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">2.4 Hours</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
              <Zap className="w-3 h-3" /> 75% within first 6 hours
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Channel Efficiency
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">75% SMS</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Primary conversion medium
            </p>
          </div>
        </div>
      </div>

      {/* 2. RECOVERY INSIGHTS & CHANNEL CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Recovery by Channel
            </h4>
            <span className="text-[10px] font-bold text-slate-400">All time</span>
          </div>

          <div className="space-y-3">
            {MOCK_RECOVERY_ANALYTICS.channelBreakdown.map((channel) => (
              <div key={channel.channel} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{channel.channel}</span>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(channel.revenue)}{' '}
                    <span className="text-slate-400 font-normal">({channel.sharePercent}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${channel.color} rounded-full`}
                    style={{ width: `${channel.sharePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              SMS automated reminders with 10% discount codes deliver a <strong>4.2x higher conversion</strong> than generic reminders in Bangladesh.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Time-to-Recovery Speed Breakdown
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Conversion Velocity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MOCK_RECOVERY_ANALYTICS.recoverySpeedBreakdown.map((item) => (
              <div
                key={item.speed}
                className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-center flex flex-col justify-center items-center"
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {item.speed}
                </span>
                <span className="text-xl font-extrabold text-slate-900">{item.percent}%</span>
                <span className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  {item.count} orders saved
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Fastest recovery recorded: <strong className="text-slate-800">42 minutes</strong></span>
            <span>Recommended follow-up window: <strong className="text-emerald-700">1 - 2 hours</strong></span>
          </div>
        </div>
      </div>

      {/* 3. RECOVERED ORDERS LOG TABLE */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900">
              Recovered Carts Log ({recoveredCarts.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Carts converted back into successful revenue
            </p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg">
            100% Verified Sales
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Customer</th>
                <th scope="col" className="px-4 py-3">Converted Order</th>
                <th scope="col" className="px-4 py-3">Items</th>
                <th scope="col" className="px-4 py-3">Coupon Used</th>
                <th scope="col" className="px-4 py-3 text-right">Recovered Amount</th>
                <th scope="col" className="px-4 py-3">Recovered Timeline</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recoveredCarts.map((cart) => {
                const itemCount = getItemCount(cart.itemsJson);
                return (
                  <tr key={cart.id} className="hover:bg-slate-50/70 transition-colors align-middle">
                    {/* CUSTOMER */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-full ${getAvatarTint(cart.id)} flex items-center justify-center text-[11px] font-extrabold shrink-0`}
                        >
                          {getInitials(cart.customerName)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {cart.customerName}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-emerald-600" />
                            {cart.customerPhone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CONVERTED ORDER ID */}
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs font-extrabold text-emerald-800">
                        <span>{cart.recoveredOrderId || '#ORD-84920'}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </div>
                    </td>

                    {/* ITEMS */}
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-slate-800">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {Array.isArray(cart.itemsJson) && cart.itemsJson[0]?.title}
                      </p>
                    </td>

                    {/* COUPON */}
                    <td className="px-4 py-3.5">
                      {cart.discountCode ? (
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-mono text-[10px] font-bold">
                          {cart.discountCode}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">None</span>
                      )}
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-extrabold text-emerald-700">
                        {formatCurrency(cart.totalAmount)}
                      </span>
                    </td>

                    {/* TIMELINE */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>
                          {formatDate(cart.createdAt)} {formatTime(cart.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Saved via SMS Channel
                      </p>
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewCart(cart.id)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        Details
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
