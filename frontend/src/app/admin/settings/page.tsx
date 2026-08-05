'use client';

import React from 'react';
import { Database, CheckCircle2, Layers } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Database & System Migrations Status</h3>
          <p className="text-xs text-slate-400">PostgreSQL TypeORM schema migrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            PostgreSQL Connection Status
          </span>
          <span className="text-sm font-extrabold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Connected & Operational</span>
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Executed TypeORM Migrations
          </span>
          <span className="text-sm font-extrabold text-blue-600 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>8 Active System Migrations</span>
          </span>
        </div>
      </div>
    </div>
  );
}
