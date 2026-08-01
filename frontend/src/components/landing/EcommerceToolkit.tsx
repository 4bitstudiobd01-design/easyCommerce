'use client';

import React, { useState } from 'react';
import {
  Truck,
  Package,
  BarChart3,
  Monitor,
  ShoppingBag,
  Palette,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export function EcommerceToolkit() {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <section id="features" className="py-20 px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Complete Infrastructure
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            An eCommerce toolkit built for growth
          </h2>
          <p className="text-slate-500 text-base font-normal">
            Everything you need to run your store — from courier booking to native MFS checkout.
          </p>
        </div>

        {/* Bento Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Automated Courier Logistics */}
          <div className="solid-card p-8 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit border border-blue-100">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Automated Courier Integration</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Book Steadfast, Pathao, and REDX shipments with 1-click. Automatic tracking status update sent directly to customer SMS.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Steadfast / Pathao Sync</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-bold">
                1-Click Booking
              </span>
            </div>
          </div>

          {/* Card 2: Decoupled Multi-Warehouse Stock */}
          <div className="solid-card p-8 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit border border-emerald-100">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Decoupled Inventory Domain</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Independent inventory service managing stock reserves, multi-warehouse allocations, and low-stock instant alerts.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Reserve Stock Locks</span>
              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px] font-bold">
                Zero Overbooking
              </span>
            </div>
          </div>

          {/* Card 3: Real-time Analytics & Revenue */}
          <div className="solid-card p-8 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit border border-indigo-100">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Live Revenue Analytics</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Track daily order volume, conversion funnels, top selling products, and merchant payouts from a single dashboard.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Conversion Funnels</span>
              <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[10px] font-bold">
                Real-time CSV Exports
              </span>
            </div>
          </div>

          {/* Card 4 (Wide 2-Column): Responsive Device Live Preview Toggle */}
          <div className="solid-card p-8 rounded-2xl md:col-span-2 flex flex-col justify-between space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900">Mobile-First High Conversion UI</h3>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Optimized storefront design for fast load times over 3G/4G networks in Bangladesh.
                </p>
              </div>

              {/* Device Toggle Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
                <button
                  onClick={() => setDevice('desktop')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    device === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Desktop Preview
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    device === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mobile View
                </button>
              </div>
            </div>

            {/* Mockup Store Card Window */}
            <div
              className={`mx-auto w-full transition-all duration-300 ${
                device === 'mobile' ? 'max-w-sm' : 'max-w-full'
              }`}
            >
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-b border-slate-200 pb-2">
                  <span className="text-slate-900 font-extrabold flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-600" /> Storefront Live Demo
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ● Active Store
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="h-16 bg-blue-50 rounded border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                      Product Image
                    </div>
                    <p className="font-bold text-slate-900 text-[11px] truncate">Premium Polo Shirt</p>
                    <p className="text-blue-600 font-black text-xs">৳ 1,250</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="h-16 bg-emerald-50 rounded border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px]">
                      Product Image
                    </div>
                    <p className="font-bold text-slate-900 text-[11px] truncate">Leather Slim Wallet</p>
                    <p className="text-blue-600 font-black text-xs">৳ 850</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Order & Customer Management */}
          <div className="solid-card p-8 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit border border-purple-100">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Express Order Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Manage order statuses (Pending, Processing, Courier Handover, Delivered, Returned) with bulk action shortcuts.
              </p>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bulk Invoice Generation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SMS Notification Trigger</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
