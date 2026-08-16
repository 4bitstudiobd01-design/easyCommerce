import React from 'react';
import { Store, Package, CreditCard, Activity } from 'lucide-react';

const STATS = [
  {
    id: 1,
    value: '1,000+',
    label: 'Active Stores',
    icon: Store,
  },
  {
    id: 2,
    value: '50K+',
    label: 'Orders Delivered',
    icon: Package,
  },
  {
    id: 3,
    value: '৳ 150M+',
    label: 'GMV Processed',
    icon: CreditCard,
  },
  {
    id: 4,
    value: '99.9%',
    label: 'Uptime & Reliability',
    icon: Activity,
  },
];

export function MetricsStrip() {
  return (
    <section className="py-6 px-6 max-w-7xl mx-auto w-full">
      <div className="text-center mb-4">
        <p className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
          Trusted by growing businesses
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className={`flex items-center gap-4 ${
                idx !== 0 ? 'md:border-l md:border-slate-100 md:pl-6' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
