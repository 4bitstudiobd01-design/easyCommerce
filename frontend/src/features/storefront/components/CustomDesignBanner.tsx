import React from 'react';
import { Info, ExternalLink } from 'lucide-react';

export function CustomDesignBanner() {
  return (
    <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start md:items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-200 text-blue-600 flex items-center justify-center shrink-0 bg-white">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[13px] font-extrabold text-slate-900 mb-0.5">Need a custom look?</h3>
          <p className="text-[12px] font-medium text-slate-600">Hire our expert designers to build a unique storefront for your brand.</p>
        </div>
      </div>
      
      <button className="shrink-0 h-10 px-5 rounded-xl border border-blue-200 bg-white text-blue-600 text-[13px] font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm">
        Request Custom Design
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
