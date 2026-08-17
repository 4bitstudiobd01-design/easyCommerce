import React from 'react';
import {
  ShoppingBag,
  Package,
  CreditCard,
  Truck,
  Users,
  BarChart2,
  Palette,
  Megaphone,
} from 'lucide-react';

const FEATURES = [
  {
    id: 1,
    title: 'Products & Catalog',
    desc: 'Manage products, categories, variants and inventory effortlessly.',
    icon: ShoppingBag,
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    id: 2,
    title: 'Orders Management',
    desc: 'Process orders, manage statuses, invoices and order fulfillment.',
    icon: Package,
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 3,
    title: 'Payments',
    desc: 'Accept payments, manage transactions, refunds and multiple gateways.',
    icon: CreditCard,
    iconBg: 'bg-purple-50 text-purple-600',
  },
  {
    id: 4,
    title: 'Courier & Delivery',
    desc: 'Create shipments, track deliveries and manage COD effortlessly.',
    icon: Truck,
    iconBg: 'bg-orange-50 text-orange-600',
  },
  {
    id: 5,
    title: 'Customers',
    desc: 'Manage customers, view purchase history and build stronger relationships.',
    icon: Users,
    iconBg: 'bg-indigo-50 text-indigo-600',
  },
  {
    id: 6,
    title: 'Analytics & Reports',
    desc: 'Track revenue, orders, customers and store performance with powerful reports.',
    icon: BarChart2,
    iconBg: 'bg-teal-50 text-teal-600',
  },
  {
    id: 7,
    title: 'Storefront & Theme',
    desc: 'Customize your storefront with beautiful themes without coding.',
    icon: Palette,
    iconBg: 'bg-rose-50 text-rose-600',
  },
  {
    id: 8,
    title: 'Marketing Tools',
    desc: 'Track pixels, run campaigns and recover abandoned carts.',
    icon: Megaphone,
    iconBg: 'bg-sky-50 text-sky-600',
  },
];

export function FeaturesShowcase() {
  return (
    <section id="features" className="py-20 px-6 bg-slate-50/50 scroll-mt-16">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything you need to grow your business
          </h2>
        </div>

        {/* 8 Features Grid (4x2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl ${feat.iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
