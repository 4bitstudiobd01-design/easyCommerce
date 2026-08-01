import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export function Pricing() {
  const plans = [
    {
      name: 'Free Plan',
      price: '৳0',
      period: '/forever',
      description: 'Perfect for new merchants starting their online journey in Bangladesh.',
      features: [
        'Up to 50 Product Listings',
        'Standard Storefront Theme',
        'Cash on Delivery (COD) Support',
        'Manual Order Management',
        'Community Support',
      ],
      cta: 'Start For Free',
      popular: false,
    },
    {
      name: 'Growth Plan',
      price: '৳990',
      period: '/month',
      description: 'Ideal for growing brands requiring automated MFS & courier booking.',
      features: [
        'Unlimited Product SKUs & Variants',
        'bKash & Nagad Direct Gateway API',
        'Automated Steadfast & Pathao Booking',
        'Custom Domain Binding (SSL)',
        'Decoupled Multi-Warehouse Inventory',
        'Priority Phone & Chat Support',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise Plan',
      price: '৳2,990',
      period: '/month',
      description: 'For high-volume merchants needing team RBAC roles and custom SLAs.',
      features: [
        'Everything in Growth Plan',
        'Multi-Store Management Under 1 Account',
        'Staff RBAC Roles (Manager, Accountant)',
        'Dedicated Database Read Replicas',
        'SSLCommerz & Custom Gateways',
        '24/7 Dedicated Account Manager',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Fair BDT Pricing
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Transparent Pricing For Every Stage
          </h2>
          <p className="text-slate-600 text-base">
            No hidden transaction fees. Upgrade or downgrade anytime as your store scales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`solid-card p-8 rounded-2xl flex flex-col justify-between relative ${
                plan.popular ? 'border-2 border-blue-600 shadow-xl' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-sm font-semibold text-slate-500">{plan.period}</span>
                </div>

                <ul className="space-y-3 pt-2">
                  {plan.features.map((feat, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                      <div className="p-1 bg-blue-50 rounded-full text-blue-600">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/register"
                  className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
