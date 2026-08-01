import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Store, ArrowLeft, BarChart3, Lock, Zap, ShieldCheck, CheckCircle2, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Merchant Sign In | EasyCommerce',
  description: 'Sign in to your EasyCommerce merchant control panel.',
};

export default function LoginPage() {
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
        {/* Left Column: Login Form */}
        <div className="lg:col-span-6 flex justify-center lg:justify-start">
          <LoginForm />
        </div>

        {/* Right Column: Admin Panel Feature Banner */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Merchant Control Center
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Manage orders, payouts & stock from one dashboard
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Log in to access your isolated merchant control panel with real-time revenue analytics, automated invoice generation, and courier tracking.
            </p>
          </div>

          {/* Key Feature Bullets */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 mt-0.5">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Real-time Order Funnels & Revenue Analytics</h4>
                <p className="text-xs text-slate-500 font-medium">Track conversion rates and export financial CSV reports.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Instant bKash & Nagad Settlement</h4>
                <p className="text-xs text-slate-500 font-medium">Direct merchant payouts with zero transaction holding delay.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Secure Single Sign-On Access</h4>
                <p className="text-xs text-slate-500 font-medium">Encrypted JWT authorization with active session controls.</p>
              </div>
            </div>
          </div>

          {/* Live Mock Stats Box */}
          <div className="solid-card p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Platform Processing Volume</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                ● High Concurrency Active
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ৳ 3,787.8M <span className="text-xs font-semibold text-slate-500">Processed</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
