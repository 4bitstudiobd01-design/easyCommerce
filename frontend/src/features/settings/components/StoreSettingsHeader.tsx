import React from 'react';
import { ExternalLink } from 'lucide-react';

export function StoreSettingsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">Store Settings</h1>
        <p className="text-[13px] font-medium text-slate-500">Manage and configure your store settings to control how your business runs.</p>
      </div>
      <button className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-700 flex items-center gap-2 transition-colors shrink-0 shadow-sm">
        <span className="text-slate-500 font-medium">Need help?</span> <span className="text-blue-600">View documentation</span>
        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
      </button>
    </div>
  );
}
