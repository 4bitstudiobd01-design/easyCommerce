import React from 'react';
import { CreditCard, Truck, Palette, Send } from 'lucide-react';

/**
 * Capability claims for the landing page.
 *
 * Every figure here is counted from code in this repo — see the note on each
 * item. Keep it that way: this strip replaced hardcoded growth metrics that
 * nothing could back. If a claim stops being true, change it here.
 */
const CAPABILITIES = [
  {
    id: 'payments',
    // payment/services: initiate- and validate-sslcommerz-payment
    value: 'bKash · Nagad · Cards',
    label: 'via SSLCommerz',
    icon: CreditCard,
    isCompact: true,
  },
  {
    id: 'couriers',
    // logistics/adapters: steadfast, pathao, redx, paperfly
    value: '4',
    label: 'Courier integrations',
    icon: Truck,
    isCompact: false,
  },
  {
    id: 'themes',
    // storefront/themes: Default, LuxuryFashion, MinimalDark, OrganicGrocery, TechHub
    value: '5',
    label: 'Storefront themes',
    icon: Palette,
    isCompact: false,
  },
  {
    id: 'notifications',
    // sms/drivers: bulksmsbd, greenweb, smtp-email, webpush
    value: '4',
    label: 'Notification channels',
    icon: Send,
    isCompact: false,
  },
];

export function MetricsStrip() {
  return (
    <section className="py-6 px-6 max-w-7xl mx-auto w-full">
      <div className="text-center mb-4">
        <p className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
          Built for Bangladesh commerce
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
        {CAPABILITIES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 ${
                idx !== 0 ? 'md:border-l md:border-slate-100 md:pl-6' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3
                  className={`font-black text-slate-900 tracking-tight ${
                    item.isCompact
                      ? 'text-sm sm:text-base leading-snug'
                      : 'text-xl sm:text-2xl tabular-nums'
                  }`}
                >
                  {item.value}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
