'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const REVENUE_CURVE_DATA = [
  { day: 'Jul 8', val: 32000 },
  { day: 'Jul 15', val: 46000 },
  { day: 'Jul 22', val: 28000 },
  { day: 'Jul 29', val: 52000 },
  { day: 'Aug 5', val: 44000 },
  { day: 'Aug 12', val: 68000 },
];

const DONUT_STATUS_DATA = [
  { name: 'Delivered', value: 60, color: '#2563eb' },
  { name: 'Processing', value: 25, color: '#10b981' },
  { name: 'Pending', value: 10, color: '#f59e0b' },
  { name: 'Canceled', value: 5, color: '#ef4444' },
];

export function DashboardShowcaseSection() {
  return (
    <section id="dashboard" className="py-20 px-4 sm:px-6 bg-white overflow-hidden scroll-mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        
        {/* =======================================================================
            LEFT COLUMN: 100% EXACT RECREATED DASHBOARD WINDOW MOCKUP
        ======================================================================= */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[680px] bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-200/80 overflow-hidden flex flex-col">
            
            {/* Main Window Body (Sidebar + Content) */}
            <div className="flex min-h-[420px]">
              
              {/* 1. Left Dark Navy Sidebar */}
              <div className="w-44 bg-[#0a0f1d] p-4 text-slate-400 flex flex-col justify-between shrink-0 hidden sm:flex border-r border-slate-800">
                <div className="space-y-4">
                  {/* Sidebar Logo */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shadow-blue-500/30">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-white tracking-tight leading-none">EasyCommerce</p>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">Dashboard Admin</p>
                    </div>
                  </div>

                  {/* Sidebar Menu Items */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2.5 shadow-xs">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span>Orders</span>
                      </div>
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center">
                        24
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span>Products</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Customers</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2.5">
                      <Boxes className="w-3.5 h-3.5 text-slate-400" />
                      <span>Inventory</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Payments</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Courier</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2.5">
                      <Megaphone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Marketing</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2.5">
                      <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Analytics</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Discounts</span>
                    </div>
                  </div>
                </div>

                {/* Sidebar Bottom */}
                <div className="pt-2 border-t border-slate-800/80 px-1 text-[10px] text-slate-400 flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Store Settings</span>
                </div>
              </div>

              {/* 2. Main Dashboard Panel */}
              <div className="flex-1 bg-[#fbfcfd] p-4 sm:p-5 space-y-4 flex flex-col justify-between">
                
                {/* Top Bar inside Content */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-[10px] w-36 sm:w-44">
                    <Search className="w-3 h-3 text-slate-400" />
                    <span>Search anything...</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 cursor-pointer hover:underline">
                      Visit Store <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                    <div className="relative">
                      <Bell className="w-3.5 h-3.5 text-slate-500" />
                      <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                        BH
                      </div>
                      <div className="hidden sm:block text-left leading-none">
                        <p className="text-[10px] font-bold text-slate-900">Belal Hossain</p>
                        <p className="text-[8px] text-slate-400">Merchant</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Title */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Dashboard</h3>
                </div>

                {/* 3 KPI Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 mt-1">৳ 2,45,000</p>
                    <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                      <TrendingUp className="w-2.5 h-2.5" /> +20.5% from last 30 days
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Orders</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 mt-1">1,256</p>
                    <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                      <TrendingUp className="w-2.5 h-2.5" /> +15.2% from last 30 days
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Customers</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 mt-1">1,024</p>
                    <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                      <TrendingUp className="w-2.5 h-2.5" /> +18.0% from last 30 days
                    </span>
                  </div>
                </div>

                {/* Bottom 2 Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  
                  {/* Card 1: Revenue Overview Area Chart */}
                  <div className="sm:col-span-7 bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-900">Revenue Overview</span>
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        <span>Last 30 days</span>
                        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                    </div>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={REVENUE_CURVE_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="dashboardAreaBlue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="val"
                            stroke="#2563eb"
                            strokeWidth={2}
                            fill="url(#dashboardAreaBlue)"
                            dot={{ r: 3, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Card 2: Orders by Status Donut Chart */}
                  <div className="sm:col-span-5 bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-900">Orders by Status</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 py-1">
                      {/* Donut Chart with Center Text */}
                      <div className="relative w-20 h-20 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={DONUT_STATUS_DATA}
                              innerRadius={24}
                              outerRadius={36}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {DONUT_STATUS_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-black text-slate-900 leading-none">1,256</span>
                          <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Total</span>
                        </div>
                      </div>

                      {/* Donut Legend */}
                      <div className="space-y-1 text-[9px] font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <span>Delivered</span>
                          <span className="font-bold text-slate-900 ml-auto">60%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Processing</span>
                          <span className="font-bold text-slate-900 ml-auto">25%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Pending</span>
                          <span className="font-bold text-slate-900 ml-auto">10%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>Canceled</span>
                          <span className="font-bold text-slate-900 ml-auto">5%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: POWERFUL DASHBOARD HEADLINE & FEATURES CHECKLIST
        ======================================================================= */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <div>
            <span className="text-xs font-bold text-slate-500 tracking-wider block mb-1">
              Powerful Dashboard
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Everything in one place
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Get a complete overview of your business performance with real-time analytics and insights that help you make better decisions.
          </p>

          <ul className="space-y-3.5 pt-1">
            {[
              'Real-time performance overview',
              'Advanced analytics & reports',
              'Track orders and revenue',
              'Monitor store growth',
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 group transition-colors"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
