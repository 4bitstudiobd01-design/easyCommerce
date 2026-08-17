import React from 'react';
import { Store, Package, CreditCard, Rocket } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Create Your Store',
    desc: 'Sign up and set up your store in just a few minutes.',
    icon: Store,
  },
  {
    step: '02',
    title: 'Add Your Products',
    desc: 'Add products, set inventory and organize your catalog.',
    icon: Package,
  },
  {
    step: '03',
    title: 'Connect Payments & Delivery',
    desc: 'Connect payment gateways and courier services.',
    icon: CreditCard,
  },
  {
    step: '04',
    title: 'Start Selling',
    desc: 'Your store is ready. Start selling online!',
    icon: Rocket,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How BitCommerce Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Start your online business in just 4 simple steps
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-7 left-12 right-12 h-0.5 bg-slate-100 -z-0" />

          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-blue-600 tracking-wider uppercase block mb-1">
                    {s.step}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed max-w-[200px]">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
