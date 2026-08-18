import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Store, BarChart3, CreditCard, Truck, Globe, ChevronDown, ShoppingBag } from 'lucide-react';

export const metadata = {
  title: 'Merchant Sign In | BitCommerce',
  description: 'Sign in to your BitCommerce merchant control panel.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex text-slate-900 font-sans">

      {/* LEFT COLUMN: Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 p-3">
        <div className="relative flex flex-col w-full rounded-3xl bg-[#EEF2FD] overflow-hidden">
          {/* Soft decorative blob in the lower right of the panel */}
          <div className="absolute -right-24 top-1/3 w-[420px] h-[420px] rounded-full bg-[#E2E9FA]" />

          {/* Dotted grid accent, top right */}
          <div
            className="absolute top-14 right-16 w-24 h-16 opacity-60"
            style={{
              backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
              backgroundSize: '9px 9px',
            }}
          />

          <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
            {/* Logo */}
            <div className="mb-12">
              <Link href="/" className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md">
                  <ShoppingBag className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[22px] text-slate-900 tracking-tight leading-none">BitCommerce</span>
                  <span className="text-slate-500 text-[12px] font-medium mt-1">Build. Manage. Grow.</span>
                </div>
              </Link>
            </div>

            {/* Typography */}
            <div className="max-w-lg mb-10">
              <h1 className="text-[34px] xl:text-[38px] font-extrabold text-slate-900 tracking-tight leading-[1.2] mb-4">
                Your complete eCommerce <span className="block text-blue-600">business platform</span>
              </h1>
              <p className="text-slate-600 text-[14px] font-medium leading-relaxed max-w-[400px]">
                Manage products, orders, customers, payments, delivery and analytics — all from one powerful dashboard.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 max-w-lg mb-12">
              <div className="flex gap-4">
                <div className="p-2.5 bg-[#DCE5F9] text-blue-600 rounded-xl shrink-0 h-fit">
                  <Store className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[13px] mb-1">Launch Your Store</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Create and customize your online store in minutes.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 bg-[#DCE5F9] text-blue-600 rounded-xl shrink-0 h-fit">
                  <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[13px] mb-1">Manage Everything</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Products, orders, inventory, customers and more.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 bg-[#DCE5F9] text-blue-600 rounded-xl shrink-0 h-fit">
                  <CreditCard className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[13px] mb-1">Accept Payments</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Multiple payment gateways and secure transactions.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 bg-[#DCE5F9] text-blue-600 rounded-xl shrink-0 h-fit">
                  <Truck className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[13px] mb-1">Deliver Happiness</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Courier integration, tracking and COD management.</p>
                </div>
              </div>
            </div>

            {/* Dashboard mockup — anchored bottom-left, glow/shadow baked into the asset */}
            <div className="flex-1 relative w-full mt-auto flex items-end overflow-hidden">
              <img
                src="/login-page-img.png"
                alt="BitCommerce merchant dashboard and storefront app"
                className="w-full max-w-none h-auto object-contain object-left-bottom"
              />
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white">

        {/* Top Nav */}
        <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-end gap-6 z-10">
          <p className="text-[13px] font-medium text-slate-500">
            Don't have an account? <Link href="/register" className="text-blue-600 font-bold hover:underline">Sign up</Link>
          </p>
          <button className="flex items-center gap-2 h-9 px-3 rounded-full border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            <Globe className="w-3.5 h-3.5" />
            English
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Form */}
        <div className="flex-1 flex items-center justify-center p-8 mt-16 lg:mt-0">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center gap-2 z-10">
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="#" className="hover:text-slate-900 transition-colors">Help Center</Link>
          </div>
          <p className="text-[11px] font-medium text-slate-400">© 2026 BitCommerce. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
