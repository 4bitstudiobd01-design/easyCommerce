'use client';

import React from 'react';
import { SettingsTab } from './types';

interface SettingsTabsNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const SETTINGS_TABS: SettingsTab[] = [
  'General',
  'Branding',
  'Email',
  'Payments',
  'Notifications',
  'Registration',
  'Features',
  'Security',
  'Maintenance',
  'Advanced',
];

export function SettingsTabsNav({
  activeTab,
  onTabChange,
}: SettingsTabsNavProps) {
  return (
    <div className="border-b border-slate-200/80 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 sm:gap-4 min-w-max pb-px">
        {SETTINGS_TABS.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`py-3 px-3 sm:px-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
