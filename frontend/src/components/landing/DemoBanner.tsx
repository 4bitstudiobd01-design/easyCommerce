import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Tag, CheckSquare } from 'lucide-react';

export function DemoBanner() {
  return (
    <section className="py-12 px-6 max-w-7xl mx-auto w-full">
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-3xl p-8 md:p-14 relative overflow-hidden text-center shadow-sm">
        {/* Left Side Floating Mockup Card */}
        <div className="hidden lg:block absolute -left-12 top-1/2 -translate-y-1/2 rotate-[-8deg] w-72 bg-white p-5 rounded-2xl border border-slate-200 shadow-xl opacity-90 pointer-events-none text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Traffic analytics</span>
            </span>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">32,500</span>
          </div>

          <div className="h-20 flex items-end gap-1.5 pt-2">
            {[30, 45, 25, 75, 60, 90, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-100 rounded-t h-full flex items-end">
                <div className="w-full bg-blue-600 rounded-t" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Floating Mockup Card */}
        <div className="hidden lg:block absolute -right-12 top-1/2 -translate-y-1/2 rotate-[8deg] w-72 bg-white p-5 rounded-2xl border border-slate-200 shadow-xl opacity-90 pointer-events-none text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold text-slate-900">Create Promo Code</span>
          </div>

          <div className="space-y-2 text-[10px]">
            <div>
              <span className="text-slate-500 font-medium block">Code Name</span>
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800">
                EASYBD2026
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 font-medium">Max Discount</span>
              <span className="font-bold text-blue-600">৳200 OFF</span>
            </div>

            <div className="flex items-center gap-1 text-slate-600 font-semibold pt-1">
              <CheckSquare className="w-3 h-3 text-blue-600" />
              <span>Schedule Auto Expiry</span>
            </div>
          </div>
        </div>

        {/* Center Banner Content */}
        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded-full text-blue-700 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Store Preview</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Explore the Full Demo and <br className="hidden sm:inline" />
            Discover What's Possible
          </h2>

          <p className="text-slate-600 text-sm md:text-base font-normal max-w-xl mx-auto leading-relaxed">
            Create your free store in minutes and see exactly how it looks, functions, and grows — no credit card required.
          </p>

          <div className="pt-2">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-extrabold text-sm rounded-full inline-flex items-center gap-2.5 transition-all shadow-md active:scale-95"
            >
              <span>Create Your Free Store</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
