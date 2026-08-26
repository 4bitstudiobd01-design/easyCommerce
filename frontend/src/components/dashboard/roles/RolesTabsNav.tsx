'use client';

import React from 'react';
import { RolesTab } from './types';

interface RolesTabsNavProps {
  activeTab: RolesTab;
  onTabChange: (tab: RolesTab) => void;
  pendingRequestsCount?: number;
}

const TABS: RolesTab[] = [
  'Roles',
  'Permissions',
  'Users',
  'Permission Groups',
  'Access Requests',
];

export function RolesTabsNav({
  activeTab,
  onTabChange,
  pendingRequestsCount = 3,
}: RolesTabsNavProps) {
  return (
    <div className="border-b border-slate-200/80 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 sm:gap-4 min-w-max pb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`py-3 px-3 sm:px-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'border-[#008060] text-[#008060] font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>{tab}</span>
              {tab === 'Access Requests' && pendingRequestsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
