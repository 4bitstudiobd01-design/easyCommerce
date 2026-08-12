import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export function Pricing() {
  const plans = [
    {
      name: 'Free Plan',
      price: '৳0',
      period: '/forever',
      description: 'Perfect for launching your first store — no credit card required.',
      features: [
        '1 Store',
        'Up to 3 Staff Members',
        'Unlimited Product Listings',
        'bKash, Nagad, Cards & Cash on Delivery',
        'Automated Steadfast & Pathao Courier Booking',
      ],
      cta: 'Start For Free',
      popular: false,
    },
    {
      name: 'Growth Plan',
      price: '৳990',
      period: '/month',
      description: 'For growing brands running more than one storefront.',
      features: [
        'Up to 5 Stores',
        'Up to 10 Staff per Store',
        'Everything in Free',
        'Priority Support',
      ],
      cta: 'Upgrade to Growth',
      popular: true,
    },
    {
      name: 'Enterprise Plan',
      price: '৳2,990',
      period: '/month',
      description: 'For high-volume merchants running many stores and teams.',
      features: [
        'Unlimited Stores',
        'Unlimited Staff per Store',
        'Everything in Growth',
        'Custom SLA & Dedicated Support',
      ],
      cta: 'Upgrade to Enterprise',
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
            Start Free, Upgrade When You Grow
          </h2>
          <p className="text-slate-600 text-base">
            No hidden fees. Every plan includes full checkout, courier booking, and inventory tools.
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
                  href={plan.name === 'Free Plan' ? '/register' : '/dashboard/settings/billing'}
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

        <p className="text-center text-xs text-slate-400 font-medium">
          Already have a store?{' '}
          <Link href="/dashboard/settings/billing" className="text-blue-600 font-bold hover:underline">
            Manage your plan from your dashboard
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
