'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft } from 'lucide-react';

export default function PolicySettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <button
        type="button"
        onClick={() => router.push('/dashboard/settings')}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all w-fit"
      >
        <ArrowLeft className="w-4 h-4 text-slate-600" />
        <span>Back to Manage Shop</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Shop Policy Generator</h2>
        <p className="text-sm text-slate-500 max-w-md">
          This feature is currently under development. Soon you will be able to generate and edit your privacy policy, terms of service, and refund policies automatically.
        </p>
      </div>
    </div>
  );
}
