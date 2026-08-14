import React from 'react';
import { Square, ExternalLink, Pencil, Eye, Settings } from 'lucide-react';

export function CurrentStorefrontCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <Square className="w-4 h-4 text-blue-600 fill-blue-600" />
        <h2 className="text-sm font-bold text-slate-900">Current Storefront</h2>
      </div>

      <div className="p-6 flex flex-col xl:flex-row gap-8 items-start">
        {/* Left: Mockup Image */}
        <div className="w-full xl:w-[480px] h-[260px] bg-slate-100 rounded-xl border border-slate-200 shrink-0 flex flex-col overflow-hidden relative">
          <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4">
            <span className="text-[10px] font-bold">My Diagnostic Store</span>
            <div className="flex gap-4 text-[8px] text-slate-500">
              <span>Home</span>
              <span>Shop</span>
              <span>Categories</span>
              <span>About Us</span>
            </div>
            <div className="w-16 h-3 bg-slate-100 rounded-full"></div>
          </div>
          <div className="flex-1 bg-blue-50/50 p-6 flex items-center justify-between">
            <div className="max-w-[200px]">
              <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">Best Quality Diagnostic Tools</h3>
              <p className="text-[9px] text-slate-500 mb-4">Reliable products for accurate diagnosis and better healthcare.</p>
              <div className="w-16 h-6 bg-blue-600 rounded text-[8px] text-white flex items-center justify-center font-bold">Shop Now</div>
            </div>
            <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center relative shadow-sm border-4 border-white">
              <span className="text-xs text-slate-400">Mockup</span>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-slate-300 rounded shadow-sm border-2 border-white"></div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-slate-300 rounded shadow-sm border-2 border-white"></div>
            </div>
          </div>
        </div>

        {/* Center: Details */}
        <div className="flex-1 flex flex-col gap-6 pt-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-extrabold text-slate-900">My Diagnostic Store</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Live
              </span>
            </div>
            <a href="#" className="flex items-center gap-1.5 text-[13px] font-medium text-blue-600 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />
              mydiagnostic.easyc.app
            </a>
          </div>

          <div className="grid grid-cols-1 gap-y-4">
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 text-[13px] font-bold text-slate-500">Theme</span>
              <div className="col-span-8 flex items-center gap-2">
                <span className="text-[13px] font-bold text-slate-900">Classic Modern Storefront</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Active</span>
              </div>
            </div>
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 text-[13px] font-bold text-slate-500">Last Published</span>
              <span className="col-span-8 text-[13px] font-bold text-slate-900">Today at 10:45 AM</span>
            </div>
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 text-[13px] font-bold text-slate-500">Last Saved</span>
              <span className="col-span-8 text-[13px] font-bold text-slate-900">Today at 10:40 AM</span>
            </div>
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 text-[13px] font-bold text-slate-500">Theme Version</span>
              <span className="col-span-8 text-[13px] font-bold text-slate-900">v1.2.3</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="w-full xl:w-[280px] flex flex-col gap-3 shrink-0 pt-2">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Quick Actions</h3>
          
          <button className="h-11 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors shadow-sm">
            Open Active Storefront
            <ExternalLink className="w-4 h-4" />
          </button>
          
          <button className="h-11 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors">
            <Pencil className="w-4 h-4 text-blue-600" />
            Customize Theme
          </button>
          
          <button className="h-11 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors">
            <Eye className="w-4 h-4 text-blue-600" />
            Preview Storefront
          </button>
          
          <button className="h-11 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors">
            <Settings className="w-4 h-4 text-slate-600" />
            Storefront Settings
          </button>
        </div>
      </div>
    </div>
  );
}
