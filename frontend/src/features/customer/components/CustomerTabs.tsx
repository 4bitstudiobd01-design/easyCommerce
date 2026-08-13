'use client';

import React from 'react';
import { CustomerStatusType } from '../api/customerApi';

interface CustomerTabsProps {
  activeTab: CustomerStatusType | 'ALL';
  onTabChange: (tab: CustomerStatusType | 'ALL') => void;
  statusCounts?: {
    ALL?: number;
    ACTIVE?: number;
    INACTIVE?: number;
    BLOCKED?: number;
  };
}

export function CustomerTabs({
  activeTab,
  onTabChange,
  statusCounts,
}: CustomerTabsProps) {
  const tabs = [
    { id: 'ALL', label: 'All Customers', count: statusCounts?.ALL },
    { id: 'ACTIVE', label: 'Active', count: statusCounts?.ACTIVE },
    { id: 'INACTIVE', label: 'Inactive', count: statusCounts?.INACTIVE },
    { id: 'BLOCKED', label: 'Blocked', count: statusCounts?.BLOCKED },
  ];

  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex space-x-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.count ?? 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-bold text-xs transition-all flex items-center gap-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
