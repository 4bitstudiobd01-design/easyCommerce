'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { MobileAppBottomNav } from '@/components/landing/MobileAppBottomNav';
import {
  Search,
  Star,
  ArrowUp,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Bell,
  Check,
  ShoppingCart,
  CreditCard,
  MapPin,
  Shirt,
  FileSpreadsheet,
} from 'lucide-react';

/* =======================================================================
   MOCK DATA
======================================================================= */

const CATEGORIES = [
  { id: 'all', label: 'All Updates', count: 28, icon: Star, color: 'text-blue-500', active: true },
  { id: 'new', label: 'New Features', count: 12, icon: Star, color: 'text-emerald-500' },
  { id: 'improvement', label: 'Improvements', count: 9, icon: ArrowUp, color: 'text-blue-500' },
  { id: 'bug', label: 'Bug Fixes', count: 7, icon: Wrench, color: 'text-purple-500' },
];

const DATE_FILTERS = [
  { id: 'all-time', label: 'All Time', active: true },
  { id: 'this-month', label: 'This Month' },
  { id: 'last-3-months', label: 'Last 3 Months' },
  { id: 'last-6-months', label: 'Last 6 Months' },
  { id: 'this-year', label: 'This Year' },
  { id: '2025', label: '2025' },
];

type UpdateType = 'New Feature' | 'Improvement' | 'Bug Fix';

interface UpdateItem {
  id: string;
  date: string;
  type: UpdateType;
  title: string;
  description: React.ReactNode;
  tags: string[];
  visual: React.ReactNode;
}

const UPDATES: UpdateItem[] = [
  {
    id: '1',
    date: 'Aug 17, 2026',
    type: 'New Feature',
    title: 'Abandoned Cart Recovery',
    description: (
      <p>
        Recover lost sales with automated cart tracking and recovery tools. Identify abandoned carts
        and send personalized email or SMS reminders to customers.
      </p>
    ),
    tags: ['Marketing', 'Automation'],
    visual: (
      <div className="w-full h-full bg-emerald-50/50 rounded-2xl flex items-center justify-center relative p-6">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="absolute top-6 right-6 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-white">
          <Bell className="w-4 h-4 text-white" />
        </div>
      </div>
    ),
  },
  {
    id: '2',
    date: 'Aug 10, 2026',
    type: 'Improvement',
    title: 'Checkout Experience Improvements',
    description: (
      <div className="space-y-2">
        <p>We've made the checkout faster, smoother, and more mobile-friendly for a better customer experience.</p>
        <ul className="space-y-1.5 mt-3">
          {['Reduced checkout steps', 'Improved mobile layout', 'Better COD flow and validation'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
              </div>
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
    tags: ['Checkout'],
    visual: (
      <div className="w-full h-full bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center relative p-6">
        <div className="w-24 bg-white rounded-xl shadow-sm border border-blue-100 p-2 space-y-2">
          <div className="w-full h-12 bg-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
             <div className="absolute top-2 left-2 w-4 h-3 bg-white/20 rounded-sm" />
             <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/20" />
             <div className="absolute bottom-2 left-2 w-8 h-1.5 bg-white/20 rounded-full" />
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full" />
          <div className="w-2/3 h-2 bg-slate-100 rounded-full" />
        </div>
        <div className="absolute bottom-6 right-8 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 border-2 border-white">
          <Check className="w-4 h-4 text-white stroke-[3]" />
        </div>
      </div>
    ),
  },
  {
    id: '3',
    date: 'Aug 05, 2026',
    type: 'Bug Fix',
    title: 'Courier Tracking Synchronization Fix',
    description: (
      <p>Fixed an issue where Pathao tracking status was not updating in real-time for some orders.</p>
    ),
    tags: ['Shipping'],
    visual: (
      <div className="w-full h-full bg-purple-50/50 rounded-2xl flex items-center justify-center relative p-6">
        <div className="relative w-full max-w-[120px]">
          {/* S-curve path */}
          <svg viewBox="0 0 100 50" className="w-full h-auto stroke-purple-200" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6">
            <path d="M 10 25 C 30 -5, 50 55, 90 25" />
          </svg>
          {/* Start node */}
          <div className="absolute left-0 top-[22px] w-3 h-3 bg-white border-2 border-purple-300 rounded-full shadow-sm" />
          
          {/* Map pin */}
          <div className="absolute left-1/2 -top-6 -translate-x-1/2 flex flex-col items-center">
            <div className="w-8 h-8 bg-purple-600 rounded-full rounded-br-none rotate-45 flex items-center justify-center shadow-md">
              <MapPin className="w-4 h-4 text-white -rotate-45" />
            </div>
            <div className="w-1.5 h-1.5 bg-purple-600/30 rounded-full mt-1 blur-[1px]" />
          </div>
        </div>
        
        <div className="absolute bottom-6 right-6 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/20 border-2 border-white">
          <Check className="w-4 h-4 text-white stroke-[3]" />
        </div>
      </div>
    ),
  },
  {
    id: '4',
    date: 'Jul 29, 2026',
    type: 'Improvement',
    title: 'Product Variant Management',
    description: (
      <p>Now you can add, edit, and manage product variants more easily with our improved interface.</p>
    ),
    tags: ['Products'],
    visual: (
      <div className="w-full h-full bg-blue-50/50 rounded-2xl flex items-center justify-center relative p-4">
        <div className="w-full bg-white rounded-xl shadow-sm border border-blue-100 p-3 flex gap-3 items-center">
           <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
             <Shirt className="w-6 h-6 text-blue-600" />
           </div>
           <div className="flex-1 space-y-2">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">Size</span>
                <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1">
                  M <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">Color</span>
                <div className="w-4 h-4 rounded-full bg-blue-600 ring-2 ring-blue-100" />
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">Stock</span>
                <span className="text-[10px] font-bold text-slate-900">25</span>
             </div>
           </div>
        </div>
      </div>
    ),
  },
  {
    id: '5',
    date: 'Jul 22, 2026',
    type: 'New Feature',
    title: 'Bulk Product Import',
    description: (
      <p>Import hundreds of products at once using CSV or Excel file. Save time and manage your catalog efficiently.</p>
    ),
    tags: ['Products'],
    visual: (
      <div className="w-full h-full bg-emerald-50/50 rounded-2xl flex items-center justify-center relative p-6">
        <div className="w-16 h-20 bg-white rounded-xl shadow-sm border border-emerald-100 relative overflow-hidden flex flex-col">
          <div className="h-6 w-full bg-emerald-100 flex items-center justify-center">
            <span className="text-[9px] font-black text-emerald-700">CSV</span>
          </div>
          <div className="flex-1 p-2 flex flex-col gap-1.5 justify-center">
             <div className="w-full h-1 bg-slate-100 rounded-full" />
             <div className="w-full h-1 bg-slate-100 rounded-full" />
             <div className="w-2/3 h-1 bg-slate-100 rounded-full" />
          </div>
          {/* Fold top right */}
          <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-200 rounded-bl-lg" />
        </div>
        <div className="absolute bottom-6 right-8 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-white">
          <ArrowUp className="w-4 h-4 text-white stroke-[3]" />
        </div>
      </div>
    ),
  },
];

/* =======================================================================
   HELPER COMPONENTS
======================================================================= */

const TypeBadge = ({ type }: { type: UpdateType }) => {
  const config = {
    'New Feature': 'bg-emerald-50 text-emerald-600 border-emerald-100 icon-star',
    'Improvement': 'bg-blue-50 text-blue-600 border-blue-100 icon-arrow-up',
    'Bug Fix': 'bg-purple-50 text-purple-600 border-purple-100 icon-wrench',
  }[type];

  const Icon = type === 'New Feature' ? Star : type === 'Improvement' ? ArrowUp : Wrench;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config}`}>
      <Icon className="w-3.5 h-3.5" />
      {type}
    </div>
  );
};

/* =======================================================================
   MAIN PAGE
======================================================================= */

export default function ChangelogPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white pb-20 md:pb-0">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-6">
              What's New
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.1]">
              EasyCommerce <br />
              <span className="text-blue-600">Changelog</span>
            </h1>
            <p className="text-base text-slate-600 font-medium leading-relaxed max-w-md">
              Stay up to date with our latest features, improvements, and fixes. We're always working to make EasyCommerce better for you.
            </p>
          </div>
          
          <div className="relative w-full max-w-sm shrink-0">
            {/* Simple CSS illustration */}
            <div className="w-full aspect-[4/3] bg-slate-50 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex items-center justify-center p-8">
               <div className="w-full max-w-[240px] bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                 {/* Window Header */}
                 <div className="h-8 bg-slate-100/80 flex items-center px-3 gap-1.5 border-b border-slate-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                 </div>
                 {/* Window Body */}
                 <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                         <Star className="w-4 h-4 text-blue-600" />
                       </div>
                       <div className="space-y-1.5 flex-1">
                          <div className="h-2 bg-slate-200 rounded-full w-full" />
                          <div className="h-2 bg-slate-100 rounded-full w-2/3" />
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                         <ArrowUp className="w-4 h-4 text-emerald-600" />
                       </div>
                       <div className="space-y-1.5 flex-1">
                          <div className="h-2 bg-slate-200 rounded-full w-4/5" />
                          <div className="h-2 bg-slate-100 rounded-full w-1/2" />
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                         <Wrench className="w-4 h-4 text-purple-600" />
                       </div>
                       <div className="space-y-1.5 flex-1">
                          <div className="h-2 bg-slate-200 rounded-full w-full" />
                          <div className="h-2 bg-slate-100 rounded-full w-3/4" />
                       </div>
                    </div>
                 </div>
               </div>
               
               {/* 3D Megaphone shape (simplified with emojis/icons or absolute divs for a 3D-ish feel) */}
               <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-600 rounded-full blur-2xl opacity-20" />
               <div className="absolute bottom-4 right-4 animate-bounce">
                  <div className="text-7xl drop-shadow-xl select-none relative -rotate-12">📣</div>
               </div>
            </div>
          </div>
        </div>

        {/* --- MAIN LAYOUT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 xl:gap-16">
          
          {/* --- SIDEBAR --- */}
          <aside className="space-y-8 lg:sticky lg:top-24 h-fit">
             
             {/* Search */}
             <div className="relative">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search updates..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-11 pl-10 pr-12 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded flex items-center gap-0.5">
                 <span className="text-xs">⌘</span> K
               </div>
             </div>

             {/* Browse Updates */}
             <div>
               <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Browse Updates</h3>
               <ul className="space-y-1">
                 {CATEGORIES.map((cat) => (
                   <li key={cat.id}>
                     <button className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                       cat.active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                     }`}>
                       <div className="flex items-center gap-2.5">
                         <cat.icon className={`w-4 h-4 ${cat.active ? 'text-blue-600' : cat.color}`} />
                         {cat.label}
                       </div>
                       <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                         cat.active ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'bg-slate-100 text-slate-500'
                       }`}>
                         {cat.count}
                       </span>
                     </button>
                   </li>
                 ))}
               </ul>
             </div>

             {/* Filter by Date */}
             <div>
               <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Filter by Date</h3>
               <ul className="space-y-2 px-1">
                 {DATE_FILTERS.map((filter) => (
                   <li key={filter.id}>
                     <label className="flex items-center gap-3 cursor-pointer group">
                       <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                         filter.active ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                       }`}>
                         {filter.active && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                       </div>
                       <span className={`text-sm font-medium ${filter.active ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                         {filter.label}
                       </span>
                     </label>
                   </li>
                 ))}
               </ul>
             </div>

             {/* Build in public widget */}
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
               <h4 className="text-sm font-bold text-slate-900 mb-2">We build in public</h4>
               <p className="text-xs text-slate-500 leading-relaxed mb-4">
                 Have feedback or a feature request? We'd love to hear from you.
               </p>
               <button className="w-full flex items-center justify-center gap-2 h-9 bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 text-xs font-bold rounded-xl transition-colors">
                 Send Feedback <ArrowRight className="w-3.5 h-3.5" />
               </button>
             </div>
          </aside>

          {/* --- CONTENT AREA --- */}
          <div>
            {/* Top Bar (Count + Subscribe) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
              <p className="text-sm font-bold text-slate-500">
                28 Updates Found
              </p>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-900 whitespace-nowrap">Subscribe to updates</span>
                <div className="flex w-full sm:w-auto">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="h-9 px-3 w-full sm:w-48 bg-white border border-slate-200 border-r-0 rounded-l-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-r-xl transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline List */}
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-100 hidden md:block" />

              <div className="space-y-12">
                {UPDATES.map((update) => (
                  <div key={update.id} className="relative flex flex-col md:flex-row gap-6 md:gap-12 group">
                    
                    {/* Date (Left Side) */}
                    <div className="md:w-20 shrink-0 md:text-right pt-1 z-10">
                      <div className="text-xs font-bold text-slate-900">{update.date.split(',')[0]}</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">{update.date.split(',')[1]?.trim()}</div>
                      {/* Timeline Dot */}
                      <div className="hidden md:block absolute left-10 top-2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 transition-colors" />
                    </div>

                    {/* Card Content */}
                    <Link 
                      href={`/changelog/${update.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow p-6 lg:p-8 flex flex-col xl:flex-row gap-8 xl:items-center relative overflow-hidden group block"
                    >
                      
                      {/* Left Info */}
                      <div className="flex-1 space-y-4">
                        <TypeBadge type={update.type} />
                        
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3">
                            {update.title}
                          </h2>
                          <div className="text-sm text-slate-600 leading-relaxed max-w-xl">
                            {update.description}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {update.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Visual Snippet */}
                      <div className="w-full xl:w-64 h-48 xl:h-40 shrink-0">
                        {update.visual}
                      </div>

                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12 pt-8 border-t border-slate-100">
              <nav className="flex items-center gap-1.5" aria-label="Pagination">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
                  1
                </button>
                {[2, 3, 4, 5].map((page) => (
                  <button key={page} className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-slate-200 bg-transparent hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors">
                    {page}
                  </button>
                ))}
                <span className="px-1 text-slate-400 text-xs font-bold">...</span>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-slate-200 bg-transparent hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            </div>

          </div>
        </div>
      </main>

      <Footer />
      <MobileAppBottomNav />
    </div>
  );
}
