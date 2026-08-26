'use client';

import React from 'react';
import { Megaphone, HelpCircle, ChevronRight } from 'lucide-react';

interface SupportQuickActionsCardProps {
  onCreateAnnouncement: () => void;
  onOpenHelpCenter: () => void;
}

export function SupportQuickActionsCard({
  onCreateAnnouncement,
  onOpenHelpCenter,
}: SupportQuickActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
      {/* Header */}
      <h3 className="text-sm font-bold text-slate-800 tracking-tight pb-3 border-b border-slate-100">
        Quick Actions
      </h3>

      <div className="pt-3 space-y-2.5">
        {/* Action 1: Create Announcement */}
        <div
          onClick={onCreateAnnouncement}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block leading-tight truncate">
                Create Announcement
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Send platform-wide announcement
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Action 2: Help Center */}
        <div
          onClick={onOpenHelpCenter}
          className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 block leading-tight truncate">
                Help Center
              </span>
              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                Manage help articles & guides
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>
      </div>
    </div>
  );
}
