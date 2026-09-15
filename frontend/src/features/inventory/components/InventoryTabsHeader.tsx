'use client';

import React from 'react';

export type InventoryTabKey = 'overview' | 'inventory';

interface InventoryTabItem {
  key: InventoryTabKey;
  label: string;
}

const INVENTORY_TABS: InventoryTabItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'inventory', label: 'Inventory' },
];

interface InventoryTabsHeaderProps {
  activeTab: InventoryTabKey;
  onTabChange: (tab: InventoryTabKey) => void;
}

export function InventoryTabsHeader({
  activeTab,
  onTabChange,
}: InventoryTabsHeaderProps) {
  return (
    <nav aria-label="Inventory sections" className="border-b border-slate-200">
      <ul className="flex items-center gap-1 overflow-x-auto">
        {INVENTORY_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <li key={tab.key}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onTabChange(tab.key)}
                className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
