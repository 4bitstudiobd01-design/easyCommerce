'use client';

import React from 'react';
import { ArrowUp, ArrowDown, TrendingUp, Store, Sparkles, Lightbulb } from 'lucide-react';
import { useGetAnalyticsInsightsQuery, type InsightSeverity } from '../api/analyticsApi';
import { useAnalyticsDateParams } from '../context/AnalyticsFiltersContext';
import { Skeleton } from '@/components/ui/Skeleton';

const ICONS: Record<string, React.ElementType> = {
  revenue_trend: TrendingUp,
  top_channel: Store,
  top_product: Sparkles,
  returning_share: ArrowUp,
};

const severityStyle = (severity: InsightSeverity, type: string): { icon: React.ElementType; iconBg: string; iconColor: string } => {
  const icon = ICONS[type] || Lightbulb;
  if (severity === 'negative') return { icon: type === 'revenue_trend' ? ArrowDown : icon, iconBg: 'bg-red-50', iconColor: 'text-red-600' };
  if (severity === 'positive') return { icon, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' };
  return { icon, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' };
};

export function InsightsList() {
  const dateParams = useAnalyticsDateParams();
  const { data, isLoading } = useGetAnalyticsInsightsQuery(dateParams);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
        <Skeleton className="h-5 w-24 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const insights = data || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Insights</h3>
      </div>

      {insights.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <Lightbulb className="w-6 h-6 text-slate-300" />
          <p className="text-slate-500 font-medium text-xs">
            Check back once more order data is available.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between gap-2">
          {insights.map((insight, index) => {
            const { icon: Icon, iconBg, iconColor } = severityStyle(insight.severity, insight.type);
            return (
              <div key={index} className="flex items-center gap-4 p-2 -mx-2 rounded-lg">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-slate-900 truncate">{insight.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{insight.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
