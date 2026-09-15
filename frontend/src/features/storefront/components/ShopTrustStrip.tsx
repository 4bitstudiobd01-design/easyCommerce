'use client';

import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones, Award } from 'lucide-react';
import { SHOPEASE_TRUST_FEATURES } from '../data/defaultStorefrontData';

export const ShopTrustStrip = () => {
  return (
    <section className="py-8 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* 1. Free Shipping */}
            <div className="flex items-center gap-3.5 pt-4 md:pt-0 first:pt-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <h4 className="font-extrabold text-xs text-slate-900">Free Shipping</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">On orders over ৳1,000</p>
              </div>
            </div>

            {/* 2. Secure Payment */}
            <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:pl-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <h4 className="font-extrabold text-xs text-slate-900">Secure Payment</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">100% secure payment</p>
              </div>
            </div>

            {/* 3. Easy Returns */}
            <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:pl-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <h4 className="font-extrabold text-xs text-slate-900">Easy Returns</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">7 days return policy</p>
              </div>
            </div>

            {/* 4. 24/7 Support */}
            <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:pl-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <h4 className="font-extrabold text-xs text-slate-900">24/7 Support</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">We're here to help</p>
              </div>
            </div>

            {/* 5. Best Quality */}
            <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:pl-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <h4 className="font-extrabold text-xs text-slate-900">Best Quality</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Premium products</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
