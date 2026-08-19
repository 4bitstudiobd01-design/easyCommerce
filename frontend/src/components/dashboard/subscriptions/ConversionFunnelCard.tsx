'use client';

import React from 'react';
import { CONVERSION_FUNNEL_METRICS } from './subscriptionMockData';

export function ConversionFunnelCard() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
      <h3 className="text-[13px] font-bold text-slate-900 mb-4">
        Conversion Funnel (This Month)
      </h3>

      <div className="space-y-4">
        {CONVERSION_FUNNEL_METRICS.map((metric) => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{metric.label}</span>
              <span className="font-semibold text-slate-900">{metric.value}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${metric.percentage}%`,
                  backgroundColor: metric.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
