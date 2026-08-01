import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Store, ShieldCheck, Globe, Zap, Heart, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'About Us | EasyCommerce',
  description: 'Learn about EasyCommerce — Bangladesh #1 Enterprise Multi-Tenant eCommerce SaaS Engine.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-16 px-6 max-w-6xl mx-auto w-full space-y-16">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Our Mission
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Empowering Every Bangladeshi Merchant To Scale Online
          </h1>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            EasyCommerce was built with a single goal: to democratize eCommerce technology in Bangladesh. We give D2C brands, retail merchants, and creators enterprise-grade tools with zero coding required.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="solid-card p-8 rounded-2xl space-y-3">
            <div className="p-3 bg-blue-50 w-fit rounded-xl border border-blue-100 text-blue-600">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Local Ecosystem First</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              We built native first-party integrations for bKash, Nagad, SSLCommerz, Steadfast, and Pathao so merchants never struggle with complex API setups.
            </p>
          </div>

          <div className="solid-card p-8 rounded-2xl space-y-3">
            <div className="p-3 bg-emerald-50 w-fit rounded-xl border border-emerald-100 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">100% Data Isolation</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Our multi-tenant PostgreSQL architecture enforces strict row-level security context, guaranteeing complete data privacy and sub-second performance.
            </p>
          </div>

          <div className="solid-card p-8 rounded-2xl space-y-3">
            <div className="p-3 bg-indigo-50 w-fit rounded-xl border border-indigo-100 text-indigo-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">High-Concurrency Speed</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Engineered with NestJS modular monolith backend and Next.js frontend to handle flash sales and heavy traffic spikes without breaking down.
            </p>
          </div>
        </div>

        {/* Vision Callout Banner */}
        <div className="solid-card p-10 rounded-3xl bg-blue-50 border border-blue-200 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Ready to build your dream online store?
            </h2>
            <p className="text-slate-600 text-sm">
              Join 10,000+ Bangladeshi merchants using EasyCommerce today.
            </p>
          </div>

          <Link
            href="/register"
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 shrink-0 inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <Store className="w-4 h-4" />
            <span>Launch Store Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
