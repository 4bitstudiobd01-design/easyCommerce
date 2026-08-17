import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/* =======================================================================
   AUTHENTIC SVG LOGOS MATCHING REFERENCE IMAGE 1
======================================================================= */

// 1. SSLCommerz Logo
function SslCommerzLogo() {
  return (
    <div className="h-7 px-3 bg-[#00609c] text-white rounded-md flex items-center justify-center font-black text-[11px] tracking-wider shadow-2xs">
      SSLCOMMERZ
    </div>
  );
}

// 2. bKash Logo
function BkashLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="w-5 h-5 text-[#e2136e]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 12l4 4 6-6 6 6 4-4L12 2zm0 8l-3 3 3 3 3-3-3-3z" />
      </svg>
      <span className="font-extrabold text-sm text-[#e2136e] tracking-tight">bKash</span>
    </div>
  );
}

// 3. Nagad Logo
function NagadLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#f7941d" />
        <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6c0-1.5-.5-2.8-1.5-3.8L12 12l2-4c-.6-.7-1.3-1.3-2-2z" fill="#ffffff" />
      </svg>
      <span className="font-extrabold text-sm text-slate-800 tracking-tight">Nagad</span>
    </div>
  );
}

// 4. Stripe Logo
function StripeLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-5 rounded-full bg-[#635bff] flex items-center justify-center text-white font-black text-xs">
        S
      </div>
      <span className="font-black text-sm text-[#635bff] tracking-tight">stripe</span>
    </div>
  );
}

// 5. VISA Logo
function VisaLogo() {
  return (
    <div className="font-black text-lg text-[#1a1f71] italic tracking-tighter flex items-center">
      <span className="text-[#f7b600]">V</span>ISA
    </div>
  );
}

// 6. Mastercard Logo
function MastercardLogo() {
  return (
    <div className="flex items-center">
      <div className="w-4.5 h-4.5 rounded-full bg-[#eb001b]" />
      <div className="w-4.5 h-4.5 rounded-full bg-[#f79e1b] -ml-2 opacity-90" />
    </div>
  );
}

// 7. Steadfast Courier Logo
function SteadfastLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="w-5 h-5 text-[#00a884]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 4l5 3-5 3-5-3 5-3z" />
      </svg>
      <span className="font-extrabold text-xs text-slate-800 tracking-tight">Steadfast</span>
    </div>
  );
}

// 8. Pathao Courier Logo
function PathaoLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-4.5 h-4.5 rounded-full bg-[#e21b22] text-white flex items-center justify-center font-black text-[10px]">
        P
      </div>
      <span className="font-extrabold text-xs text-slate-800 tracking-tight">Pathao</span>
    </div>
  );
}

// 9. REDX Courier Logo
function RedxLogo() {
  return (
    <div className="flex items-center gap-1">
      <svg className="w-4.5 h-4.5 text-[#e31e24]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
      </svg>
      <span className="font-black text-xs text-[#e31e24] tracking-tight">REDX</span>
    </div>
  );
}

// 10. Paperfly Logo
function PaperflyLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-4.5 h-4.5 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-black text-[10px]">
        P
      </div>
      <span className="font-extrabold text-xs text-slate-800 tracking-tight">Paperfly</span>
    </div>
  );
}

// 11. Express / eCourier Logo
function ExpressLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-4.5 h-4.5 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-black text-[10px]">
        e
      </div>
      <span className="font-extrabold text-xs text-[#dc2626] tracking-tight">Express</span>
    </div>
  );
}

// 12. e-Parcel / G-Parcel Logo
function EParcelLogo() {
  return (
    <div className="flex items-center gap-1">
      <span className="font-black text-xs text-[#ea580c] tracking-tight">e-Parcel</span>
    </div>
  );
}

/* =======================================================================
   PAYMENTS & DELIVERY SECTION (EXACT MATCHING DESIGN)
======================================================================= */

export function IntegrationsSection() {
  return (
    <section id="integrations" className="py-16 px-4 sm:px-6 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto bg-[#f8faff] rounded-3xl border border-blue-100/70 p-6 sm:p-10 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* 1. LEFT TEXT COLUMN */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Payments, Delivery and beyond
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              BitCommerce integrates with leading payment gateways and courier services to make your operations smooth.
            </p>
            <div className="pt-3">
              <Link
                href="/#features"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group"
              >
                <span>View Integrations</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 2. MIDDLE CARD: MULTIPLE PAYMENT OPTIONS */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <p className="text-xs font-bold text-slate-900 mb-6">Multiple Payment Options</p>
              
              {/* Row 1 */}
              <div className="grid grid-cols-3 gap-4 items-center mb-6">
                <div className="flex items-center justify-start">
                  <SslCommerzLogo />
                </div>
                <div className="flex items-center justify-center">
                  <BkashLogo />
                </div>
                <div className="flex items-center justify-end">
                  <NagadLogo />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="flex items-center justify-start">
                  <StripeLogo />
                </div>
                <div className="flex items-center justify-center">
                  <VisaLogo />
                </div>
                <div className="flex items-center justify-center">
                  <MastercardLogo />
                </div>
                <div className="flex items-center justify-end text-[10px] text-slate-400 font-medium">
                  and more...
                </div>
              </div>
            </div>
          </div>

          {/* 3. RIGHT CARD: COURIER PARTNERS */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between h-full min-h-[180px] relative">
            <div>
              <p className="text-xs font-bold text-slate-900 mb-6">Courier Partners</p>
              
              {/* Row 1 */}
              <div className="grid grid-cols-3 gap-4 items-center mb-6">
                <div className="flex items-center justify-start">
                  <SteadfastLogo />
                </div>
                <div className="flex items-center justify-center">
                  <PathaoLogo />
                </div>
                <div className="flex items-center justify-end">
                  <RedxLogo />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center justify-start">
                  <PaperflyLogo />
                </div>
                <div className="flex items-center justify-center">
                  <ExpressLogo />
                </div>
                <div className="flex items-center justify-end">
                  <EParcelLogo />
                </div>
              </div>
            </div>

            {/* Bottom Right "and more..." */}
            <div className="text-[10px] text-slate-400 font-medium text-right mt-2">
              and more...
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
