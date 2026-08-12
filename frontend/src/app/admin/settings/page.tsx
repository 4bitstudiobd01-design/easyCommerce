'use client';

import React from 'react';
import { Database, Terminal } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Database & System Migrations</h3>
          <p className="text-xs text-slate-400">PostgreSQL schema managed via TypeORM migrations</p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs">
        <Terminal className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-600">
          <p className="font-semibold text-slate-800">
            Live database connection and migration status are not surfaced in this dashboard yet.
          </p>
          <p>
            Check migration state from the backend with{' '}
            <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">
              npm run migration:show
            </code>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
