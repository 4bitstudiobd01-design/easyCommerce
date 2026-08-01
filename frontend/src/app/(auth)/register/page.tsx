import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { Store, ArrowLeft, ShieldCheck, CheckCircle2, Truck, Smartphone, Star } from 'lucide-react';

export const metadata = {
  title: 'Merchant Registration | EasyCommerce',
  description: 'Create your merchant store account on EasyCommerce SaaS platform.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation Bar with Logo & Back Button */}
      <header className="w-full bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-700 transition-colors">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">EasyCommerce</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">SaaS</span>
          </div>
        </Link>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main 2-Column Split Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Brand Value Banner & Platform Highlights */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Merchant Onboarding
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Launch your digital storefront in Bangladesh in 5 minutes
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Zero coding required. Everything you need to sell physical goods, digital products, or dropship — with native bKash checkout and 1-click Steadfast courier booking.
            </p>
          </div>

          {/* Key Feature Bullets */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Native bKash & Nagad Checkout</h4>
                <p className="text-xs text-slate-500 font-medium">Instant mobile payment verification with zero setup fee.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Steadfast & Pathao Courier APIs</h4>
                <p className="text-xs text-slate-500 font-medium">Automated order booking and real-time SMS delivery tracking.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">100% Tenant Isolation Security</h4>
                <p className="text-xs text-slate-500 font-medium">Row-level PostgreSQL database security protecting your store data.</p>
              </div>
            </div>
          </div>

          {/* Social Proof Card */}
          <div className="solid-card p-6 rounded-2xl bg-white space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
              <span className="text-slate-900 font-bold text-xs ml-2">4.9/5 Merchant Rating</span>
            </div>
            <p className="text-xs text-slate-700 italic font-medium">
              "EasyCommerce gave me a full website to build my brand. Customers can browse and pay via bKash easily."
            </p>
            <span className="text-[11px] text-slate-500 font-bold block">— Farzana Haque, Owner at Mrittika</span>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <RegisterForm />
        </div>
      </main>
    </div>
  );
}
