'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import {
  FileText,
  Shield,
  CreditCard,
  Truck,
  UserCheck,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Scale,
  RefreshCw,
  Store,
} from 'lucide-react';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms', icon: Scale },
  { id: 'account', title: '2. Merchant Account & Store Ownership', icon: Store },
  { id: 'acceptable-use', title: '3. Acceptable Use & Prohibited Activities', icon: AlertTriangle },
  { id: 'payments', title: '4. Payment Gateways & Transactions', icon: CreditCard },
  { id: 'logistics', title: '5. Courier & Shipping Logistics', icon: Truck },
  { id: 'security', title: '6. Data Isolation & Security', icon: Lock },
  { id: 'fees', title: '7. Subscriptions & Billing', icon: RefreshCw },
  { id: 'liability', title: '8. Limitation of Liability', icon: Shield },
  { id: 'termination', title: '9. Account Termination & Data Retention', icon: UserCheck },
  { id: 'contact', title: '10. Contact & Legal Inquiries', icon: HelpCircle },
];

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* HERO BANNER */}
      <section className="relative bg-gradient-to-b from-blue-900 via-[#0F172A] to-slate-900 text-white pt-28 pb-20 px-6 overflow-hidden">
        {/* Decorative Grid & Glow */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #60A5FA 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <FileText className="w-3.5 h-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Terms of Service
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Please read these terms carefully before registering your store or using the BitCommerce multi-tenant eCommerce SaaS platform.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400 font-medium">
            <span>Effective Date: January 1, 2026</span>
            <span>•</span>
            <span>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT WITH STICKY SIDEBAR */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          
          {/* STICKY TABLE OF CONTENTS */}
          <aside className="hidden lg:block sticky top-28 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
              Table of Contents
            </h3>
            <nav className="space-y-1">
              {SECTIONS.map(({ id, title, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    activeSection === id
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${activeSection === id ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">{title}</span>
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-5 border-t border-slate-100 px-2">
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                Have questions about our terms or compliance?
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>Contact Legal Support</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* POLICY CONTENT SECTIONS */}
          <div className="space-y-10">
            
            {/* Overview Alert */}
            <div className="p-6 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
                <Scale className="w-5 h-5" />
              </div>
              <div className="text-sm text-slate-700 leading-relaxed">
                <h3 className="font-bold text-slate-900 text-base mb-1">Agreement Summary</h3>
                <p>
                  By creating an account, launching an online storefront, or using any services provided by BitCommerce,
                  you enter into a legally binding contract. You agree that you are solely responsible for the products
                  you sell, customer fulfillment, and compliance with local laws and regulations in Bangladesh and abroad.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <section id="acceptance" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                These Terms of Service ("Terms") govern your access to and use of the BitCommerce platform, web applications,
                APIs, documentation, and storefront services ("Platform").
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                By registering an account, clicking "Create Account", or utilizing any merchant or customer-facing features,
                you agree to be bound by these Terms and our Privacy Policy. If you are registering on behalf of a company
                or legal entity, you represent and warrant that you have the full legal authority to bind that entity.
              </p>
            </section>

            {/* Section 2 */}
            <section id="account" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Store className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">2. Merchant Account & Store Ownership</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                When you create a store on BitCommerce:
              </p>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Accurate Registration:</strong> You must provide a valid email, accurate phone number, and legitimate store information.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Account Security:</strong> You are responsible for safeguarding your credentials and all activities occurring under your store account.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Store Content Ownership:</strong> You retain all intellectual property rights to your product imagery, descriptions, trademarks, and logos uploaded to the Platform.</span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="acceptable-use" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">3. Acceptable Use & Prohibited Activities</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Merchants must comply with all applicable Bangladesh trade laws, electronic commerce guidelines, and consumer rights regulations. You strictly agree NOT to:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  'Sell prohibited, counterfeit, stolen, or illegal goods',
                  'Engage in fraudulent transactions or misleading pricing',
                  'Attempt to breach multi-tenant row-level isolation',
                  'Distribute malware, spam, or perform DDoS attacks',
                  'Impersonate another brand, business, or government agency',
                  'Violate customer privacy or mismanage order data',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4 */}
            <section id="payments" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">4. Payment Gateways & Transactions</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                BitCommerce provides deep integrations with digital payment providers (e.g. SSLCommerz, bKash, Nagad) and Cash-on-Delivery (COD) flows:
              </p>
              <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
                <li>Merchant transactions are settled directly via the payment gateway credentials configured in the merchant control panel.</li>
                <li>BitCommerce does not hold or escrow your customer funds. All chargebacks, refunds, and disputes are between you, your payment processor, and your customer.</li>
                <li>You agree to clearly publish your store's return and refund policies for your customers.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="logistics" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">5. Courier & Shipping Logistics</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Couriers (including Steadfast Courier, Pathao Courier, and Paperfly) operate under independent merchant agreements. BitCommerce facilitates automated consignment creation, tracking API synchronization, and delivery status updates.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                We are not liable for courier transit delays, physical package damages, or lost parcel claims during transit.
              </p>
            </section>

            {/* Section 6 */}
            <section id="security" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">6. Data Isolation & Security</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                BitCommerce utilizes an enterprise-grade multi-tenant architecture. Every tenant's data (products, orders, customer records, payment settings) is strictly isolated using database-level tenancy constraints and role-based permissions.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                We employ industry-standard encryption in transit (HTTPS/TLS) and at rest to safeguard sensitive data.
              </p>
            </section>

            {/* Section 7 */}
            <section id="fees" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">7. Subscriptions & Billing</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                BitCommerce offers Free tier access as well as premium subscription tiers (e.g. Starter, Growth, Enterprise) and premium theme unlocks. Subscription renewals and theme purchases are billed upfront according to your chosen plan.
              </p>
            </section>

            {/* Section 8 */}
            <section id="liability" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">8. Limitation of Liability</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                To the maximum extent permitted by applicable law, BitCommerce and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities arising out of your use of the platform.
              </p>
            </section>

            {/* Section 9 */}
            <section id="termination" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">9. Account Termination & Data Retention</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                You may permanently delete your store at any time via the Store Settings dashboard. We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent transactions, or compromise platform integrity.
              </p>
            </section>

            {/* Section 10 */}
            <section id="contact" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">10. Contact & Legal Inquiries</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                If you have questions regarding these Terms or need assistance with your store's legal compliance:
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1.5 font-medium">
                <p><strong>Entity:</strong> BitCommerce Technologies Ltd.</p>
                <p><strong>Email:</strong> legal@bitcommerce.app / support@bitcommerce.app</p>
                <p><strong>Address:</strong> Banani, Dhaka - 1213, Bangladesh</p>
                <p>
                  <strong>Web Contact:</strong>{' '}
                  <Link href="/contact" className="text-blue-600 font-bold hover:underline">
                    bitcommerce.app/contact
                  </Link>
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
