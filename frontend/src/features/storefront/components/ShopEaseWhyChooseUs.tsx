'use client';

import React from 'react';
import { Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { SHOPEASE_FEATURES } from '../data/defaultStorefrontData';

interface ShopEaseWhyChooseUsProps {
  storeName?: string;
}

export const ShopEaseWhyChooseUs = ({ storeName = 'Our Store' }: ShopEaseWhyChooseUsProps) => {
  return (
    <section className="py-14 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION TITLE */}
        <div className="text-center mb-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-black uppercase tracking-wider shadow-2xs">
            <span>💎 Our Guarantee</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Why Customers Trust {storeName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            We ensure a reliable, hassle-free, and secure shopping experience from order placement to doorstep delivery.
          </p>
        </div>

        {/* 3 COLUMNS FEATURE ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8 max-w-5xl mx-auto">
          {/* Feature 1: Fast Delivery */}
          <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50/80 hover:bg-blue-50/30 transition-all duration-200 border border-slate-100/90 hover:border-blue-200 shadow-2xs group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Fast Nationwide Delivery</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                Prompt dispatch and real-time package tracking.
              </p>
            </div>
          </div>

          {/* Feature 2: Secure Payment */}
          <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50/80 hover:bg-emerald-50/30 transition-all duration-200 border border-slate-100/90 hover:border-emerald-200 shadow-2xs group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">100% Secure Checkout</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                Cash on delivery & verified digital payments.
              </p>
            </div>
          </div>

          {/* Feature 3: Easy Returns */}
          <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50/80 hover:bg-purple-50/30 transition-all duration-200 border border-slate-100/90 hover:border-purple-200 shadow-2xs group">
            <div className="w-12 h-12 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <RotateCcw className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Authentic & Verified</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                Genuine quality backed by our store guarantee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
