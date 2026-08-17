'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { MobileAppBottomNav } from '@/components/landing/MobileAppBottomNav';
import {
  ArrowLeft,
  Star,
  Calendar,
  Tag,
  Clock,
  Bell,
  ShoppingCart,
  Mail,
  MessageSquare,
  BarChart2,
  LogOut,
  Send,
  CheckCircle2,
  Crown,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  ChevronRight,
  Check,
} from 'lucide-react';

export default function ChangelogDetailsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white pb-20 md:pb-0">
      <Navbar />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        
        {/* --- BACK LINK --- */}
        <Link href="/changelog" className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Changelog
        </Link>

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-bold mb-5">
              <Star className="w-3.5 h-3.5" />
              New Feature
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
              Abandoned Cart Recovery
            </h1>
            
            <p className="text-base text-slate-600 font-medium leading-relaxed mb-6">
              Recover more lost sales with automated abandoned cart tracking and personalized recovery messages via email and SMS.
            </p>

            <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                August 17, 2026
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                Version 1.8.0
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                4 min read
              </div>
            </div>
          </div>
          
          <div className="relative w-full max-w-sm shrink-0">
            {/* Visual Header Graphic */}
            <div className="w-full aspect-[4/3] relative flex items-center justify-center p-8">
              {/* Background dots pattern */}
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#e2e8f0 2px, transparent 2px)', backgroundSize: '16px 16px', opacity: 0.5, maskImage: 'linear-gradient(to right, transparent, black 30%, black 70%, transparent)' }} />
              
              <div className="w-40 h-40 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-center relative z-10">
                <ShoppingCart className="w-20 h-20 text-slate-400" />
              </div>
              <div className="absolute top-1/4 right-1/4 translate-x-12 -translate-y-4 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 border-4 border-white z-20">
                <Bell className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN LAYOUT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 xl:gap-16 items-start">
          
          {/* --- LEFT CONTENT AREA --- */}
          <div className="space-y-16">
             
             {/* Section: What's New */}
             <section id="whats-new" className="scroll-mt-24">
               <h2 className="text-2xl font-bold text-slate-900 mb-4">What's New</h2>
               <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mb-8">
                 Merchants can now identify abandoned carts and recover lost sales automatically. You can send personalized email or SMS reminders to encourage customers to complete their purchase.
               </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { icon: ShoppingCart, title: 'Track Abandoned Carts', desc: 'Automatically detect carts that are left behind.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                   { icon: Mail, title: 'Email Reminders', desc: 'Send personalized emails to customers.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                   { icon: MessageSquare, title: 'SMS Reminders', desc: 'Reach customers via SMS messages.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                   { icon: BarChart2, title: 'Recovery Analytics', desc: 'Track recovery rate and revenue in real time.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 ].map((item, idx) => (
                   <div key={idx} className="flex flex-col items-center text-center">
                     <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center mb-4`}>
                       <item.icon className={`w-5 h-5 ${item.color}`} />
                     </div>
                     <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                     <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                   </div>
                 ))}
               </div>
             </section>

             {/* Section: How It Works */}
             <section id="how-it-works" className="scroll-mt-24">
               <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
               
               <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                 {[
                   { step: 1, icon: ShoppingCart, title: 'Cart is Created', desc: 'Customer adds products to the cart.', color: 'text-blue-600', bg: 'bg-blue-50' },
                   { step: 2, icon: LogOut, title: 'Customer Leaves', desc: 'Customer leaves the store without completing order.', color: 'text-purple-600', bg: 'bg-purple-50' },
                   { step: 3, icon: Clock, title: 'Cart is Abandoned', desc: 'The system marks the cart as abandoned.', color: 'text-amber-600', bg: 'bg-amber-50' },
                   { step: 4, icon: Send, title: 'Recovery Message Sent', desc: 'Automated email or SMS is sent to recover the sale.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 ].map((item, idx, arr) => (
                   <React.Fragment key={idx}>
                     <div className="flex flex-col items-center text-center relative max-w-[160px]">
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center z-10 border-2 border-white">
                         {item.step}
                       </div>
                       <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-4 relative`}>
                         <item.icon className={`w-6 h-6 ${item.color}`} />
                       </div>
                       <h4 className="text-sm font-bold text-slate-900 mb-1.5">{item.title}</h4>
                       <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                     </div>
                     {idx < arr.length - 1 && (
                       <div className="hidden md:block w-8 shrink-0 text-slate-300">
                         <ArrowRight className="w-5 h-5" />
                       </div>
                     )}
                   </React.Fragment>
                 ))}
               </div>
             </section>

             {/* Section: Key Benefits */}
             <section id="key-benefits" className="scroll-mt-24">
               <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Benefits</h2>
               
               <ul className="space-y-4">
                 {[
                   'Recover up to 25% more lost sales',
                   'Improve customer engagement and retention',
                   'Build stronger relationships with personalized messages',
                   'Easy setup with powerful automation'
                 ].map((benefit, idx) => (
                   <li key={idx} className="flex items-center gap-3">
                     <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                     <span className="text-sm font-medium text-slate-700">{benefit}</span>
                   </li>
                 ))}
               </ul>
             </section>

             {/* Section: Availability */}
             <section id="availability" className="scroll-mt-24">
               <h2 className="text-2xl font-bold text-slate-900 mb-6">Availability</h2>
               
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                   <Crown className="w-6 h-6 text-blue-600" />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-slate-900 mb-1">This feature is available for Growth and Business plans.</h4>
                   <Link href="/#pricing" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                     Compare all plans <ArrowRight className="w-3 h-3" />
                   </Link>
                 </div>
               </div>
             </section>

             {/* Feedback */}
             <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Was this update helpful?</h4>
                  <p className="text-xs text-slate-500">Your feedback helps us improve.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors">
                    <ThumbsUp className="w-4 h-4" /> Yes, helpful
                  </button>
                  <button className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors">
                    <ThumbsDown className="w-4 h-4" /> Not really
                  </button>
                </div>
             </div>

          </div>

          {/* --- RIGHT SIDEBAR --- */}
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
            
            {/* Update Info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-5">Update Info</h3>
              <dl className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-xs text-slate-500">Type</dt>
                  <dd className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">New Feature</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-xs text-slate-500">Release Date</dt>
                  <dd className="text-xs font-medium text-slate-900">August 17, 2026</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-xs text-slate-500">Version</dt>
                  <dd className="text-xs font-medium text-slate-900">1.8.0</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-slate-500 mt-0.5">Category</dt>
                  <dd className="flex flex-wrap justify-end gap-1.5">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Marketing</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Automation</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
                  <dt className="text-xs text-slate-500">Availability</dt>
                  <dd className="text-xs font-medium text-slate-900">Growth Plan and above</dd>
                </div>
              </dl>
            </div>

            {/* On This Page */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">On This Page</h3>
              <ul className="space-y-1 border-l-2 border-slate-100">
                {[
                  { id: 'whats-new', label: "What's New", active: true },
                  { id: 'how-it-works', label: 'How It Works' },
                  { id: 'key-benefits', label: 'Key Benefits' },
                  { id: 'availability', label: 'Availability' },
                ].map((item) => (
                  <li key={item.id} className="relative">
                    {item.active && (
                      <div className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-blue-600 rounded-r-full" />
                    )}
                    <a 
                      href={`#${item.id}`} 
                      className={`block pl-4 py-1.5 text-xs font-medium transition-colors ${item.active ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Try it out today */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Try it out today!</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Enable Abandoned Cart Recovery from your dashboard in just a few clicks.
              </p>
              <Link href="/dashboard" className="w-full flex items-center justify-center gap-1.5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors mb-6 shadow-sm">
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Dashboard Snippet UI */}
              <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center">
                         <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                       </div>
                       <div>
                         <div className="text-[10px] font-bold text-slate-900">Abandoned Cart Recovery</div>
                         <div className="text-[8px] text-slate-500">Reach customers and recover lost sales</div>
                       </div>
                    </div>
                    {/* Toggle */}
                    <div className="w-7 h-4 bg-blue-600 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                    </div>
                 </div>
                 
                 <div className="pt-3 border-t border-slate-100">
                    <div className="text-[9px] font-medium text-slate-500 mb-1">Recovery Rate</div>
                    <div className="text-sm font-black text-slate-900 mb-2">24.5%</div>
                    
                    {/* Mini Line Chart Sparkline */}
                    <svg viewBox="0 0 100 20" className="w-full h-auto stroke-emerald-500" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M 0 15 L 20 12 L 40 18 L 60 5 L 80 10 L 100 2" />
                    </svg>
                 </div>
              </div>
            </div>

            {/* Related Updates */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Related Updates</h3>
              <ul className="space-y-4 mb-6">
                {[
                  { title: 'Checkout Experience Improvements', date: 'Aug 10, 2026' },
                  { title: 'Marketing Automation', date: 'Jul 29, 2026' },
                  { title: 'Bulk Product Import', date: 'Jul 22, 2026' },
                ].map((item, idx) => (
                  <li key={idx}>
                    <Link href="#" className="group flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-0.5">{item.title}</h4>
                        <div className="text-[10px] text-slate-500">{item.date}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4 border-t border-slate-100 text-center">
                <Link href="/changelog" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  View all updates <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </aside>
        </div>
      </main>

      <Footer />
      <MobileAppBottomNav />
    </div>
  );
}
