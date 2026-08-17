'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Boxes,
  CreditCard,
  Truck,
  Megaphone,
  BarChart2,
  Tag,
  Settings,
  ExternalLink,
  Bell,
  Search,
  ChevronDown,
  Layers,
  Heart,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const HERO_CHART_DATA = [
  { day: 'Jul 15', val: 28000 },
  { day: 'Jul 22', val: 42000 },
  { day: 'Jul 29', val: 56000 },
  { day: 'Aug 5', val: 48000 },
  { day: 'Aug 12', val: 78000 },
];

export function Hero() {
  return (
    <section className="relative pt-8 pb-16 md:pt-12 md:pb-20 px-4 sm:px-6 bg-gradient-to-b from-white via-slate-50/40 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        
        {/* =======================================================================
            LEFT COLUMN: HERO HEADLINE, SUBTITLE, CTAS, TRUST POINTS
        ======================================================================= */}
        <div className="lg:col-span-5 space-y-6 text-left z-10">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[46px] xl:text-[50px] font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Build Your Online Store.{' '}
            <span className="text-blue-600 block mt-1">Sell Without the Complexity.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 max-w-lg font-normal leading-relaxed">
            BitCommerce gives you everything you need to launch, manage and grow your online business—from products and orders to payments, delivery and analytics.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>Start Your Store — Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/#features"
              className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-blue-600 ml-0.5" />
              </div>
              <span>See How It Works</span>
            </Link>
          </div>

          {/* Trust Checkmarks */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-5 pt-2 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-full border border-slate-100 sm:border-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>No developer required</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-full border border-slate-100 sm:border-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Easy store setup</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-full border border-slate-100 sm:border-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: EXACT RECREATED DASHBOARD + SMARTPHONE MOCKUP
        ======================================================================= */}
        <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[660px]">
            
            {/* Ambient Lighting Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-teal-500/15 rounded-3xl blur-2xl -z-10" />

            {/* 1. DESKTOP DASHBOARD WINDOW MOCKUP */}
            <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col">
              
              {/* Header Top Bar */}
              <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-extrabold text-xs tracking-tight">BitCommerce</span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-blue-400 font-bold hover:underline cursor-pointer">
                    <span>Visit Store</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                      BH
                    </div>
                    <span className="text-[11px] font-bold hidden sm:inline">Belal Hossain</span>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Layout (Dark Sidebar + Light Body) */}
              <div className="flex bg-slate-50/70 min-h-[360px]">
                
                {/* Left Mini-Sidebar */}
                <div className="w-36 bg-[#0f172a] p-3 text-slate-400 hidden sm:flex flex-col justify-between shrink-0">
                  <div className="space-y-1">
                    <div className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center gap-2 shadow-xs">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Orders</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" />
                      <span>Products</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Customers</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Inventory</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Payments</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Courier</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Marketing</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-2">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Analytics</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800 px-2.5 text-[10px] text-slate-400 flex items-center gap-1.5">
                    <Settings className="w-3 h-3" />
                    <span>Store Settings</span>
                  </div>
                </div>

                {/* Dashboard Main Body */}
                <div className="flex-1 p-4 space-y-4 pr-16 sm:pr-24">
                  {/* Dashboard Title */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900">Dashboard</h3>
                    <div className="flex items-center gap-1 text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 font-bold">
                      <span>Last 30 Days</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>

                  {/* 3 KPI Cards */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Total Revenue</p>
                      <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">৳ 2,45,000</p>
                      <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        <TrendingUp className="w-2.5 h-2.5" /> +20.5%
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Orders</p>
                      <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">1,256</p>
                      <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        <TrendingUp className="w-2.5 h-2.5" /> +15.2%
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Customers</p>
                      <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">1,024</p>
                      <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        <TrendingUp className="w-2.5 h-2.5" /> +18.3%
                      </span>
                    </div>
                  </div>

                  {/* Revenue Overview Curve Chart */}
                  <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-900">Revenue Overview</span>
                    </div>
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={HERO_CHART_DATA} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                          <defs>
                            <linearGradient id="heroBlue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Area type="monotone" dataKey="val" stroke="#2563eb" strokeWidth={2} fill="url(#heroBlue)" dot={{ r: 3, fill: '#2563eb' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Products Mini Table */}
                  <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900">Top Products</span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">👕 Casual T-Shirt</span>
                        <span className="font-bold text-slate-900">৳ 1,250</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">🧥 Denim Jacket</span>
                        <span className="font-bold text-slate-900">৳ 2,450</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">👟 Sneakers</span>
                        <span className="font-bold text-slate-900">৳ 3,200</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* 2. FLOATING FRONT SMARTPHONE MOCKUP */}
            <div className="absolute -right-3 -bottom-5 sm:-right-5 sm:-bottom-8 w-44 sm:w-52 bg-slate-950 rounded-[36px] p-2.5 shadow-2xl border-4 border-slate-800 transform rotate-1 hover:rotate-0 transition-transform duration-300 z-20">
              {/* iPhone Bezel / Notch Screen */}
              <div className="bg-white rounded-[28px] overflow-hidden text-slate-900 text-left">
                
                {/* Top Status Bar */}
                <div className="bg-slate-900 text-white px-3.5 py-1.5 flex items-center justify-between text-[9px] font-bold">
                  <span>9:41</span>
                  {/* Dynamic Island */}
                  <div className="w-12 h-3 bg-black rounded-full" />
                  <span>5G</span>
                </div>

                {/* App Storefront Nav */}
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold tracking-tight text-slate-900">Urban Style</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Search className="w-3 h-3" />
                    <div className="relative">
                      <ShoppingBag className="w-3 h-3" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                        2
                      </span>
                    </div>
                  </div>
                </div>

                {/* App Hero Banner */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-3 text-center">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-blue-200">New Season</span>
                  <p className="text-xs font-black tracking-tight leading-tight mt-0.5">NEW ARRIVALS</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-white text-blue-700 text-[8px] font-bold rounded-full shadow-2xs">
                    Shop Now
                  </span>
                </div>

                {/* Categories Row */}
                <div className="p-2.5 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] font-bold text-slate-900">Categories</span>
                    <span className="text-[8px] font-bold text-blue-600">View all</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-600 font-bold text-center">
                    <div>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-0.5">👕</div>
                      <span>Men</span>
                    </div>
                    <div>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-0.5">👗</div>
                      <span>Women</span>
                    </div>
                    <div>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-0.5">👟</div>
                      <span>Shoes</span>
                    </div>
                    <div>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-0.5">🎒</div>
                      <span>Bags</span>
                    </div>
                  </div>
                </div>

                {/* Best Sellers Grid */}
                <div className="p-2.5 space-y-1.5 bg-slate-50/60">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-900">Best Sellers</span>
                    <span className="text-[8px] font-bold text-blue-600">View all</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <div className="h-10 bg-blue-50 rounded flex items-center justify-center text-xs">
                        👕
                      </div>
                      <p className="text-[8px] font-bold text-slate-900 truncate mt-1">Casual T-Shirt</p>
                      <p className="text-[8px] font-extrabold text-blue-600">৳ 1,250</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <div className="h-10 bg-slate-100 rounded flex items-center justify-center text-xs">
                        🧥
                      </div>
                      <p className="text-[8px] font-bold text-slate-900 truncate mt-1">Denim Jacket</p>
                      <p className="text-[8px] font-extrabold text-blue-600">৳ 2,450</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
