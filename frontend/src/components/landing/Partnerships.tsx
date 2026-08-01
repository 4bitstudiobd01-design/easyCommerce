'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Truck, CreditCard, Sparkles } from 'lucide-react';

export function Partnerships() {
  const courierPartners = [
    { name: 'Pathao Courier', category: 'Logistics', badge: 'Same-day Delivery' },
    { name: 'REDX Express', category: 'Logistics', badge: 'Nationwide' },
    { name: 'Steadfast Courier', category: 'Logistics', badge: 'Automated API' },
    { name: 'Paperfly Logistics', category: 'Logistics', badge: 'Doorstep Pick' },
  ];

  const paymentPartners = [
    { name: 'bKash Merchant', category: 'MFS Gateway', badge: 'Instant Checkout' },
    { name: 'Nagad Direct', category: 'MFS Gateway', badge: 'Zero Extra Fee' },
    { name: 'Upay MFS', category: 'MFS Gateway', badge: 'Instant Settlement' },
    { name: 'SSLCommerz', category: 'Cards & NetBanking', badge: 'PCI-DSS Certified' },
    { name: 'Stripe Global', category: 'International Cards', badge: 'USD/EUR' },
  ];

  // Multiplied lists for seamless edge-to-edge infinite marquee loops
  const courierTrack = [...courierPartners, ...courierPartners, ...courierPartners, ...courierPartners];
  const paymentTrack = [...paymentPartners, ...paymentPartners, ...paymentPartners, ...paymentPartners];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200 overflow-hidden w-full">
      <div className="w-full space-y-12 text-center">
        {/* Section Header */}
        <div className="max-w-4xl mx-auto px-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Ecosystem Partners
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            In partnership with our dedicated logistics and payment partners
          </h2>
          <p className="text-slate-500 text-base font-normal">
            Pre-integrated native APIs for frictionless checkout and nationwide fulfillment.
          </p>
        </div>

        {/* Edge-to-Edge Full Width Marquee Tracks (No Max Width Restriction) */}
        <div className="w-full bg-white border-y border-slate-200 py-8 space-y-8 relative overflow-hidden select-none shadow-sm">
          {/* Left & Right Fade Gradients */}
          <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Row 1: Courier Logistics Partners (Right to Left Edge-to-Edge) */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Automated Courier Logistics</span>
            </div>

            <div className="relative w-full flex overflow-x-hidden">
              <div className="flex shrink-0 animate-marquee items-center gap-4 py-2">
                {courierTrack.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 px-6 bg-slate-50 border border-slate-200 rounded-xl text-center shrink-0 min-w-[220px] hover:border-blue-400 transition-colors shadow-sm"
                  >
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{item.name}</h4>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 block w-fit mx-auto mt-1">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 max-w-7xl mx-auto" />

          {/* Row 2: Payment & MFS Partners (Left to Right Reverse Marquee Edge-to-Edge) */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Mobile Financial Services & Card Gateways</span>
            </div>

            <div className="relative w-full flex overflow-x-hidden">
              <div className="flex shrink-0 animate-marquee-reverse items-center gap-4 py-2">
                {paymentTrack.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 px-6 bg-slate-50 border border-slate-200 rounded-xl text-center shrink-0 min-w-[220px] hover:border-emerald-400 transition-colors shadow-sm"
                  >
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{item.name}</h4>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 block w-fit mx-auto mt-1">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Callout Banner */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-8 bg-blue-50 border border-blue-200 rounded-3xl space-y-4 text-center shadow-sm">
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Take Your Business Online, Effortlessly with EasyCommerce
            </h3>
            <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto">
              Join thousands of Bangladeshi merchants and experience zero-code store setup, native bKash/Nagad checkout, and automated Steadfast/Pathao courier booking.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 inline-flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start For Free Today</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
