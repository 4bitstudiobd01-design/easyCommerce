'use client';

import React from 'react';
import { SYSTEM_STATUS_DATA } from './settingsMockData';
import { SystemStatusData } from './types';

interface SystemStatusCardProps {
  status?: SystemStatusData;
}

export function SystemStatusCard({
  status = SYSTEM_STATUS_DATA,
}: SystemStatusCardProps) {
  const percentUsed = Math.round(
    (status.storageUsedGB / status.storageTotalGB) * 100
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-2 border-b border-slate-100 uppercase">
        System Status
      </h3>

      <div className="space-y-3 text-xs">
        {/* Version */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Current Version</span>
          <span className="font-mono font-bold text-slate-800">
            {status.currentVersion}
          </span>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Last Updated</span>
          <span className="text-slate-700 font-medium text-[11px]">
            {status.lastUpdated}
          </span>
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Database Status</span>
          <div className="flex items-center gap-1.5 font-bold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{status.databaseStatus}</span>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Storage Usage</span>
            <span className="font-semibold text-slate-800 text-[11px]">
              {status.storageUsedGB} GB / {status.storageTotalGB} GB
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        {/* Active Background Jobs */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-500 font-medium">
            Active Background Jobs
          </span>
          <span className="font-extrabold text-emerald-600 text-sm">
            {status.activeBackgroundJobs}
          </span>
        </div>
      </div>
    </div>
  );
}
