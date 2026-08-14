import React from 'react';
import { Square, Check, Pencil, Eye, ChevronDown } from 'lucide-react';

export function ActiveThemeCard() {
  const features1 = ['Responsive Design', 'Hero Banner', 'Product Grid'];
  const features2 = ['Mega Menu', 'Quick View', 'Mobile Optimized'];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <Square className="w-4 h-4 text-blue-600 fill-blue-600" />
        <h2 className="text-sm font-bold text-slate-900">Active Theme</h2>
      </div>

      <div className="p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
        {/* Left: Mini Preview */}
        <div className="w-[200px] h-[120px] bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-hidden relative">
          <div className="h-4 bg-white border-b border-slate-200 flex items-center justify-between px-2">
            <div className="w-8 h-1 bg-slate-200 rounded"></div>
            <div className="w-12 h-1 bg-slate-200 rounded"></div>
          </div>
          <div className="flex-1 bg-blue-50/30 p-2 flex">
            <div className="w-full h-full border border-white bg-slate-200/50 rounded flex flex-col gap-1 p-2">
              <div className="w-16 h-3 bg-white rounded shadow-sm"></div>
              <div className="w-full flex-1 bg-white rounded shadow-sm"></div>
            </div>
          </div>
        </div>

        {/* Center: Details & Checklist */}
        <div className="flex-1 flex flex-col xl:flex-row gap-8">
          <div className="flex-1 max-w-[320px]">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Classic Modern Storefront</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-3">
              <span>General</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>Version 1.2.3</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>Updated 2 days ago</span>
            </div>
            <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
              Clean, fast and high-converting default store theme suitable for all product types.
            </p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-2.5 justify-center">
              {features1.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-[12px] font-bold text-slate-700">{f}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 justify-center">
              {features2.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-[12px] font-bold text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-full xl:w-auto flex flex-col gap-3 shrink-0 pt-2 xl:pt-0">
          <div className="flex gap-3">
            <button className="flex-1 xl:w-[120px] h-10 bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors">
              Customize
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button className="flex-1 xl:w-[100px] h-10 bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors">
              Preview
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="h-10 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors">
            More Actions
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
