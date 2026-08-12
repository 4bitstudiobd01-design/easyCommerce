import Link from 'next/link';
import { UserPlus, Store, TrendingUp, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      badge: 'Step 01',
      title: 'Create an Account',
      icon: UserPlus,
      desc: 'Welcome to EasyCommerce! Sign up to launch your online store and access powerful tools to grow your business.',
    },
    {
      badge: 'Step 02',
      title: 'Set Up Your Store',
      icon: Store,
      desc: 'Add your store name, select your category, and configure local bKash, Nagad & courier API credentials in minutes.',
    },
    {
      badge: 'Step 03',
      title: 'Start Your Sales',
      icon: TrendingUp,
      desc: "Start selling by adding your products. Enter details like title, price, stock, and photos to showcase what you're offering.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header & Top Buttons */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Simple Steps to Make Your Website Live
            </h2>
            <p className="text-slate-600 text-sm md:text-base font-normal leading-relaxed">
              No need to learn design or development. We have simplified everything so you can build your store confidently, quickly, and without any technical knowledge.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full inline-flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-95"
            >
              <span>Get started for free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3 Step Cards with Connecting Curved Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="solid-card p-8 rounded-2xl flex flex-col justify-between space-y-6 relative group hover:border-blue-300"
              >
                {/* Step Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-full shadow-sm">
                    {step.badge}
                  </span>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{step.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-normal">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
