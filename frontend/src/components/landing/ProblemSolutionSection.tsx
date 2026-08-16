import React from 'react';
import Image from 'next/image';
import { X, Check } from 'lucide-react';

const BEFORE_ITEMS = [
  'Product management in spreadsheets',
  'Manual order tracking',
  'Multiple payment systems',
  'Courier management separately',
  'No clear business analytics',
];

const AFTER_ITEMS = [
  'One powerful merchant dashboard',
  'Products & inventory management',
  'Orders & customers in one place',
  'Payments, refunds & settlements',
  'Courier, tracking & COD management',
  'Analytics & actionable insights',
];

export function ProblemSolutionSection() {
  return (
    <section id="solutions" className="py-20 px-6 bg-white overflow-hidden scroll-mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* LEFT COLUMN: TITLE & COMPARISON LISTS */}
        <div className="lg:col-span-7 space-y-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-xl">
            Running an online business shouldn't mean managing 10 different tools.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Column 1: Before EasyCommerce */}
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                Before EasyCommerce
              </div>
              <ul className="space-y-3">
                {BEFORE_ITEMS.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: With EasyCommerce */}
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                With EasyCommerce
              </div>
              <ul className="space-y-3">
                {AFTER_ITEMS.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-900 font-semibold">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MERCHANT ILLUSTRATION */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 p-4 shadow-sm flex items-center justify-center">
            <Image
              src="/images/landing/merchant-comparison.jpg"
              alt="Merchant managing multiple fragmented ecommerce tools"
              width={600}
              height={600}
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
