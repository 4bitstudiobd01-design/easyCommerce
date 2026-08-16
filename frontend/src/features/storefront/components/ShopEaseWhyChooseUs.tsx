'use client';

import React from 'react';
import { Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { SHOPEASE_FEATURES } from '../data/defaultStorefrontData';

export const ShopEaseWhyChooseUs = () => {
  return (
    <section className="py-12 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION TITLE */}
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            <span>💎 Our Commitment</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Why Millions Trust ShopEase
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            We guarantee a seamless, transparent, and ultra-secure online shopping journey from checkout to delivery.
          </p>
        </div>

        {/* 3 COLUMNS FEATURE ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Feature 1: Fast Delivery */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Fast Delivery</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Get your orders quickly at your doorstep.
              </p>
            </div>
          </div>

          {/* Feature 2: Secure Payment */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Secure Payment</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                100% secure payment methods.
              </p>
            </div>
          </div>

          {/* Feature 3: Easy Returns */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
              <RotateCcw className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Easy Returns</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Hassle-free returns within 7 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
