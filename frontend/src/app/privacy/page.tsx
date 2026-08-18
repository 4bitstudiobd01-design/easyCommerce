'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import {
  ShieldCheck,
  Database,
  Lock,
  Eye,
  Share2,
  Cookie,
  UserCheck,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Server,
  Layers,
  FileCheck,
} from 'lucide-react';

const SECTIONS = [
  { id: 'collection', title: '1. Information We Collect', icon: Database },
  { id: 'usage', title: '2. How We Use Your Information', icon: Eye },
  { id: 'multi-tenancy', title: '3. Multi-Tenant Data Isolation', icon: Layers },
  { id: 'sharing', title: '4. Third-Party Integrations & Data Sharing', icon: Share2 },
  { id: 'security', title: '5. Security & Data Protection', icon: Lock },
  { id: 'retention', title: '6. Data Retention & Deletion', icon: Server },
  { id: 'cookies', title: '7. Cookies & Tracking Technologies', icon: Cookie },
  { id: 'rights', title: '8. Merchant & Customer Privacy Rights', icon: UserCheck },
  { id: 'changes', title: '9. Updates to This Policy', icon: FileCheck },
  { id: 'contact', title: '10. Contact Privacy Officer', icon: HelpCircle },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('collection');

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
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Data Protection & Privacy
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Understand how BitCommerce protects your personal information, merchant store catalog, and customer order records.
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
              Privacy Outline
            </h3>
            <nav className="space-y-1">
              {SECTIONS.map(({ id, title, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    activeSection === id
                      ? 'bg-emerald-50 text-emerald-600 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${activeSection === id ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="truncate">{title}</span>
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-5 border-t border-slate-100 px-2">
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                Need details about your personal data processing?
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <span>Contact Privacy Team</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* PRIVACY POLICY CONTENT */}
          <div className="space-y-10">
            
            {/* Overview Trust Card */}
            <div className="p-6 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-sm text-slate-700 leading-relaxed">
                <h3 className="font-bold text-slate-900 text-base mb-1">Our Privacy Commitment</h3>
                <p>
                  BitCommerce ("we", "our", "the Platform") never sells your or your customers' data to third-party advertisers. 
                  Every merchant store's data is isolated with strict row-level multitenancy in our PostgreSQL database.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <section id="collection" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                We collect information to provide, operate, and enhance our multi-tenant SaaS commerce services:
              </p>
              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">A. Merchant Account Information</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Full name, email address, mobile phone number, store name, category, and encrypted password credentials provided during registration.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">B. Storefront Order & Customer Data</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    When customers place orders on your store: recipient name, phone number, shipping address, order items, transaction IDs, and delivery notes.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">C. Integration Credentials</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Courier API keys (e.g. Steadfast, Pathao) and payment gateway credentials (e.g. SSLCommerz) configured by the merchant to execute fulfillment workflows.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="usage" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Eye className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">2. How We Use Your Information</h2>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Store Management & Operation:</strong> Providing the merchant dashboard, product catalog management, and stock tracking.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Order Processing & Dispatch:</strong> Generating invoices, creating automated courier shipments, and updating order history.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Security & Fraud Prevention:</strong> Authenticating logins, preventing abuse, monitoring anomalous rate limits, and enforcing tenant isolation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Transactional Communication:</strong> Sending SMS/Email order updates, plan renewals, and platform service announcements.</span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="multi-tenancy" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">3. Multi-Tenant Data Isolation</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                BitCommerce is engineered specifically with multi-tenant domain boundaries. Every query, mutation, and background task is scoped to your specific <code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">tenantId</code>.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Other merchants on BitCommerce have zero visibility or access to your customer lists, sales metrics, or inventory data.
              </p>
            </section>

            {/* Section 4 */}
            <section id="sharing" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Share2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">4. Third-Party Integrations & Data Sharing</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                We only transmit data to third-party services when explicitly required to fulfill your store's operations:
              </p>
              <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
                <li><strong>Payment Gateways:</strong> Order amounts and reference IDs are transmitted to SSLCommerz or Mobile Financial Services (bKash/Nagad) to verify payments.</li>
                <li><strong>Courier Providers:</strong> Recipient delivery address, phone, and cash collection amount are transmitted to Steadfast Courier or Pathao Courier for parcel dispatch.</li>
                <li><strong>SMS & Email Drivers:</strong> Transactional order notifications are dispatched through verified SMTP and SMS gateway providers.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="security" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">5. Security & Data Protection</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                We maintain robust technical and organizational measures to safeguard your information:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  'Bcrypt Password Hashing & Salt Rounds',
                  'JWT Authentication with Rotatable Refresh Tokens',
                  'HTTPS / TLS 1.3 End-to-End Encryption',
                  'PostgreSQL Foreign Key & Cascade Constraints',
                  'Strict CORS and Rate Limiting Protection',
                  'Regular Automated Backups and Disaster Recovery',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 6 */}
            <section id="retention" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Server className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">6. Data Retention & Deletion</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                We retain your account and store data for as long as your store is active. If you choose to close your store via the Store Settings interface, your store data, catalog, and configuration records are permanently removed or anonymized in compliance with our data retention schedules.
              </p>
            </section>

            {/* Section 7 */}
            <section id="cookies" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Cookie className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">7. Cookies & Tracking Technologies</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                We use essential session tokens and local storage only for necessary authentication (e.g. keeping you logged into the merchant dashboard) and remembering your preferences. We do not use intrusive cross-site behavioral tracking cookies.
              </p>
            </section>

            {/* Section 8 */}
            <section id="rights" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">8. Merchant & Customer Privacy Rights</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                You have the right to access, rectify, export, or request deletion of your personal data at any time. Merchants can export customer and sales reports directly from the Orders and Customers sections of the dashboard.
              </p>
            </section>

            {/* Section 9 */}
            <section id="changes" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">9. Updates to This Policy</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                We may periodically update this Privacy Policy to reflect platform enhancements or regulatory changes. Significant updates will be highlighted on your merchant dashboard or sent via email notification.
              </p>
            </section>

            {/* Section 10 */}
            <section id="contact" className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">10. Contact Privacy Officer</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                For privacy inquiries, data export requests, or security disclosures:
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1.5 font-medium">
                <p><strong>Privacy Officer:</strong> Data Privacy & Security Team</p>
                <p><strong>Email:</strong> privacy@bitcommerce.app</p>
                <p><strong>Entity:</strong> BitCommerce Technologies Ltd., Dhaka, Bangladesh</p>
                <p>
                  <strong>Contact Center:</strong>{' '}
                  <Link href="/contact" className="text-emerald-600 font-bold hover:underline">
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
