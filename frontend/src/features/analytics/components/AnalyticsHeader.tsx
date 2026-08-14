import React from 'react';
import { Calendar, ChevronDown, Download } from 'lucide-react';

export function AnalyticsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 pt-6 pb-2 bg-white">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-[13px] font-medium text-slate-500 mt-1">Track your store performance and growth</p>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
          Aug 8 - Aug 14, 2025
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
        </button>
        
        <button className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <span className="text-slate-500 font-medium">Compare:</span> Previous 7 days
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export
        </button>
      </div>
    </div>
  );
}
