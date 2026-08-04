import Link from 'next/link';
import { Store, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Zap, PackageCheck } from 'lucide-react';

export function Hero({ title, subtitle }: { title?: string, subtitle?: string }) {
  return (
    <section className="relative py-20 px-6 bg-slate-50 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Universal Multi-Tenant Store Engine for All Product Types</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]" dangerouslySetInnerHTML={{ __html: title || 'Sell Anything Online <br /><span class="text-blue-600">Physical, Digital or Resell</span>' }}>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
          {subtitle || 'Whether you sell physical products, digital downloads, e-books, or supplier resell items — EasyCommerce empowers any Bangladeshi merchant to launch and scale effortlessly.'}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/register"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-3 transition-all active:scale-95 text-base"
          >
            <Store className="w-5 h-5" />
            <span>Launch Your Store Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/login"
            className="px-8 py-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl transition-colors text-base shadow-sm"
          >
            Sign In to Merchant Admin
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Physical & Digital Goods</span>
          </div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-purple-600" />
            <span>Supplier Resell & Dropshipping</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Data Isolation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
