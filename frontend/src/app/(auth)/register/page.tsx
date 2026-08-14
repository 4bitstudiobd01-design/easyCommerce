import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { Rocket, CreditCard, ShieldCheck, Headphones, Heart, ShoppingBag } from 'lucide-react';

export const metadata = {
  title: 'Merchant Registration | EasyCommerce',
  description: 'Create your merchant store account on EasyCommerce SaaS platform.',
};

const HIGHLIGHTS = [
  {
    icon: Rocket,
    title: 'Get Started Quickly',
    description: 'Create your store and start selling in minutes.',
    className: 'bg-blue-50 text-blue-600',
  },
  {
    icon: CreditCard,
    title: 'All-in-One Platform',
    description: 'Products, orders, payments, delivery and more.',
    className: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security for your business.',
    className: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: "We're here to help you grow your business.",
    className: 'bg-orange-50 text-orange-500',
  },
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-0 sm:p-6 lg:p-8">
      <div className="w-full min-h-[calc(100vh-4rem)] bg-white rounded-none sm:rounded-3xl shadow-xl shadow-slate-300/40 overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,48fr)_minmax(0,52fr)]">

        {/* LEFT COLUMN: Branding & Highlights */}
        <div className="hidden lg:flex flex-col bg-[#F6F8FF] relative overflow-hidden pl-12 xl:pl-16 pr-10 pt-12 pb-0">
          {/* Decorative dotted grid */}
          <div
            className="absolute top-10 right-12 w-24 h-16 opacity-[0.18]"
            style={{
              backgroundImage: 'radial-gradient(circle, #1d4ed8 1.1px, transparent 1.1px)',
              backgroundSize: '9px 9px',
            }}
          />
          {/* Decorative soft blob */}
          <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-white/70 blur-[2px]" />

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-10">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md">
                <ShoppingBag className="w-5 h-5 fill-current" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[22px] text-slate-900 tracking-tight leading-none">EasyCommerce</span>
                <span className="text-slate-500 text-[12px] font-medium mt-1">Build. Manage. Grow.</span>
              </div>
            </Link>

            {/* Trust pill */}
            <div className="inline-flex items-center gap-2 self-start h-8 px-3.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <Heart className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span className="text-[12px] font-bold text-blue-700">Trusted by 1,000+ merchants</span>
            </div>

            {/* Headline */}
            <h1 className="text-[34px] font-extrabold tracking-tight leading-[1.2] mb-4">
              Start your eCommerce <br />
              <span className="text-blue-600">journey today</span>
            </h1>
            <p className="text-slate-600 text-[13px] font-medium leading-relaxed max-w-[340px] mb-9">
              Create your EasyCommerce merchant account and launch your online store in minutes.
            </p>

            {/* Highlights */}
            <div className="space-y-5 mb-10">
              {HIGHLIGHTS.map(({ icon: Icon, title, description, className }) => (
                <div key={title} className="flex gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 h-fit ${className}`}>
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[13px] mb-0.5">{title}</h3>
                    <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dashboard Mockup — anchored to the bottom of the panel. Height is
                capped so a tall/square source image cannot stretch the layout. */}
            <div className="mt-auto pt-8">
              <img
                src="/dashboard-mockup.jpg"
                alt="EasyCommerce merchant dashboard preview"
                className="w-auto max-w-full max-h-[340px] xl:max-h-[380px] h-auto object-contain object-left-bottom mix-blend-multiply"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form */}
        <div className="flex flex-col px-6 sm:px-10 lg:px-14 xl:px-20 py-10">
          {/* Top Nav */}
          <div className="flex items-center justify-end mb-6 shrink-0">
            <p className="text-[13px] font-medium text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-bold hover:underline">Log in</Link>
            </p>
          </div>

          <div className="flex-1 flex items-center">
            <RegisterForm />
          </div>
        </div>

      </div>
    </div>
  );
}
