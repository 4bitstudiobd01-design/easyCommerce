'use client';

import React from 'react';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function RolesHelpGuideCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2.5">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
        <HelpCircle className="w-4 h-4 text-blue-600" />
        <span>Help & Guide</span>
      </div>

      <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
        Learn about roles, permissions hierarchy, scoping rules and role assignment policies.
      </p>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => toast.info('Opening RBAC & Permission Documentation...')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#008060] hover:text-[#006e52] cursor-pointer transition-colors"
        >
          <span>View documentation</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
