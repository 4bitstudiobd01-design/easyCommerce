'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';

export function CompareFeatures() {
  const plans = [
    { name: 'Free', price: '৳0', period: '/mo', cta: 'Get started', popular: false },
    { name: 'Starter', price: '৳599', period: '/mo', cta: 'Get started', popular: false },
    { name: 'Pro', price: '৳1,099', period: '/mo', cta: 'Get started', popular: true },
    { name: 'Growth', price: '৳2,499', period: '/mo', cta: 'Get started', popular: false },
  ];

  const sections = [
    {
      category: 'FEES PER ORDER',
      subtitle: 'Deducted per order based on product type',
      rows: [
        { name: 'Own physical products', free: '5%', starter: '0%', pro: '0%', growth: '0%' },
        { name: 'Own digital products', free: '10%', starter: '6%', pro: '4%', growth: '3%' },
        { name: 'Resell supplier products', free: '3%', starter: '1.9%', pro: '1%', growth: '0.75%' },
      ],
    },
    {
      category: 'SELLING',
      subtitle: 'Product limits and channel capabilities',
      rows: [
        { name: 'Sell physical products', free: true, starter: true, pro: true, growth: true },
        { name: 'Sell digital products', free: true, starter: true, pro: true, growth: true },
        { name: 'Resell supplier products', free: true, starter: true, pro: true, growth: true },
        { name: 'Own product limit', free: '10', starter: '500', pro: '2,000', growth: 'Unlimited' },
        { name: 'Resell product limit', free: '10', starter: '500', pro: '2,000', growth: 'Unlimited' },
        { name: 'Orders per month', free: 'Unlimited', starter: 'Unlimited', pro: 'Unlimited', growth: 'Unlimited' },
      ],
    },
    {
      category: 'STORE & BRANDING',
      subtitle: 'Theme design and domain binding',
      rows: [
        { name: 'Subdomain', free: 'Single', starter: 'All', pro: 'All', growth: 'All' },
        { name: 'Custom domain binding (SSL)', free: false, starter: true, pro: true, growth: true },
        { name: 'Preset storefront themes', free: '2', starter: 'Unlimited', pro: 'Unlimited', growth: 'Unlimited' },
        { name: 'Zero-code theme builder', free: false, starter: false, pro: true, growth: true },
        { name: 'Storefront Spotlight', free: false, starter: false, pro: false, growth: true },
        { name: 'Customer login page', free: false, starter: false, pro: false, growth: true },
      ],
    },
    {
      category: 'MARKETING & GROWTH',
      subtitle: 'Customer retention and tracking integrations',
      rows: [
        { name: 'Marketing pixels & GTM', free: true, starter: true, pro: true, growth: true },
        { name: 'Abandoned cart recovery', free: false, starter: false, pro: false, growth: true },
        { name: 'Exportable financial reports', free: false, starter: true, pro: true, growth: true },
      ],
    },
    {
      category: 'OPERATIONS',
      subtitle: 'Order management and inventory control',
      rows: [
        { name: 'Inventory management', free: true, starter: true, pro: true, growth: true },
        { name: 'Order management pipeline', free: true, starter: true, pro: true, growth: true },
        { name: 'Customer database & CRM', free: true, starter: true, pro: true, growth: true },
        { name: 'IP blocking & fraud protection', free: false, starter: true, pro: true, growth: true },
        { name: 'Turbo high-speed server cluster', free: false, starter: false, pro: false, growth: true },
      ],
    },
    {
      category: 'PAYMENTS & DELIVERY',
      subtitle: 'Local Bangladesh MFS and courier logistics',
      rows: [
        { name: 'EasyCommerce SecurePay', free: true, starter: true, pro: true, growth: true },
        { name: 'Self-MFS (bKash & Nagad API)', free: false, starter: false, pro: true, growth: true },
        { name: 'External payment gateways', free: false, starter: false, pro: false, growth: true },
        { name: 'Steadfast & Pathao Courier API', free: true, starter: true, pro: true, growth: true },
      ],
    },
  ];

  const renderCellContent = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="inline-flex p-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
          <Check className="w-3.5 h-3.5" />
        </div>
      ) : (
        <Minus className="w-3.5 h-3.5 text-slate-300 mx-auto" />
      );
    }
    return <span className="font-semibold text-slate-800 text-xs">{val}</span>;
  };

  return (
    <section id="compare-features" className="py-20 px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Compare Plans
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Compare all features
          </h2>
          <p className="text-slate-500 text-base font-normal">
            Every feature and per-order fee, side by side — pick the plan that fits how you sell.
          </p>
        </div>

        {/* Comparison Table Container (No Overflow Hidden to Allow Sticky Row) */}
        <div className="solid-card rounded-2xl bg-white shadow-xl border border-slate-200 relative">
          {/* Table Header Row (Sticky right underneath top Navbar at top-[73px]) */}
          <div className="grid grid-cols-5 border-b border-slate-200 sticky top-[72px] z-30 bg-white/95 backdrop-blur-md rounded-t-2xl shadow-sm">
            <div className="p-6 font-extrabold text-slate-900 text-base flex items-center">
              Features
            </div>

            {plans.map((p, i) => (
              <div
                key={i}
                className={`p-6 text-center flex flex-col justify-between items-center transition-colors ${
                  p.popular ? 'bg-blue-600 text-white' : 'bg-white text-slate-900'
                } ${i === 3 ? 'rounded-tr-2xl' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`font-extrabold text-lg ${p.popular ? 'text-white' : 'text-slate-900'}`}>
                      {p.name}
                    </span>
                    {p.popular && (
                      <span className="px-2 py-0.5 bg-white/20 text-white font-extrabold text-[9px] rounded-full uppercase tracking-wider">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-black">{p.price}</span>
                    <span className={`text-xs ${p.popular ? 'text-blue-100' : 'text-slate-400'}`}>{p.period}</span>
                  </div>
                </div>

                <Link
                  href="/register"
                  className={`mt-4 w-full py-2 px-3 text-xs font-bold rounded-xl transition-colors shadow-sm ${
                    p.popular
                      ? 'bg-white text-blue-600 hover:bg-slate-100'
                      : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Table Body Category Sections */}
          <div className="divide-y divide-slate-200 text-xs">
            {sections.map((sec, sIdx) => (
              <div key={sIdx} className="divide-y divide-slate-100">
                {/* Category Bar Header */}
                <div className="bg-slate-50/90 px-6 py-3 border-y border-slate-200 text-left">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-blue-600 block">
                    {sec.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{sec.subtitle}</span>
                </div>

                {/* Rows */}
                {sec.rows.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-5 items-center hover:bg-slate-50/50 transition-colors">
                    <div className="p-4 px-6 font-medium text-slate-700 text-xs text-left">
                      {row.name}
                    </div>
                    <div className="p-4 text-center">{renderCellContent(row.free)}</div>
                    <div className="p-4 text-center">{renderCellContent(row.starter)}</div>
                    <div className="p-4 text-center bg-blue-50/30">{renderCellContent(row.pro)}</div>
                    <div className="p-4 text-center">{renderCellContent(row.growth)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
