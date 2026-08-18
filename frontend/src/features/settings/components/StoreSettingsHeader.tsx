import React from 'react';

export function StoreSettingsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">Store Settings</h1>
        <p className="text-[13px] font-medium text-slate-500">Manage and configure your store settings to control how your business runs.</p>
      </div>
    </div>
  );
}
