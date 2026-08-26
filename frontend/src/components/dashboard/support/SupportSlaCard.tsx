'use client';

import React from 'react';
import { SLA_METRICS } from './supportMockData';
import { SlaMetric } from './types';

interface SupportSlaCardProps {
  metrics?: SlaMetric[];
}

export function SupportSlaCard({ metrics = SLA_METRICS }: SupportSlaCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
      {/* Header */}
      <h3 className="text-sm font-bold text-slate-800 tracking-tight pb-3 border-b border-slate-100">
        SLA Performance (This Month)
      </h3>

      {/* 3 Metric Columns */}
      <div className="pt-4 grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
        {metrics.map((item, idx) => (
          <div key={item.title} className={idx > 0 ? 'pl-2' : ''}>
            <span className="text-[11px] font-medium text-slate-400 block truncate">
              {item.title}
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 block tracking-tight mt-1">
              {item.value}
            </span>
            <span className="text-[10px] text-slate-400 block truncate mt-0.5">
              {item.subtitle}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
