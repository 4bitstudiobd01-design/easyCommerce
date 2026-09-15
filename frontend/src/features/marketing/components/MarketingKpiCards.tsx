import React from 'react';
import { Link, CheckCircle2, Activity, AlertCircle, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketingDashboardResponse } from '../api/marketingApi';
import { Skeleton } from '@/components/ui/Skeleton';

interface MarketingKpiCardsProps {
  kpis?: MarketingDashboardResponse['kpis'];
  isLoading?: boolean;
}

export function MarketingKpiCards({ kpis, isLoading }: MarketingKpiCardsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl w-full" />
        ))}
      </div>
    );
  }

  const renderTrend = (text?: string, direction?: 'up' | 'down') => {
    if (!text || !direction) return null;
    const isUp = direction === 'up';
    const textColor = isUp ? 'text-emerald-600' : 'text-red-600';
    const bgColor = isUp ? 'bg-emerald-50' : 'bg-red-50';
    const Icon = isUp ? TrendingUp : TrendingDown;
    return (
      <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
        <Icon className={`w-3 h-3 ${textColor}`} />
        <span className={textColor}>{text.split(' ')[0]}</span>
        <span>{text.split(' ').slice(1).join(' ')}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {/* Connected Pixels */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-blue-600">Connected Pixels</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
              <Link className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {kpis.connectedPixels.count}
            {kpis.connectedPixels.total ? (
              <span className="text-[13px] text-slate-500 font-medium tracking-normal"> of {kpis.connectedPixels.total} pixels</span>
            ) : (
              <span className="text-[13px] text-slate-500 font-medium tracking-normal"> pixels</span>
            )}
          </div>
        </div>
        <div className="mt-3">
          {renderTrend(kpis.connectedPixels.changeText, kpis.connectedPixels.changeDirection)}
        </div>
      </div>

      {/* Active Pixels */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-emerald-600">Active Pixels</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpis.activePixels.count}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{kpis.activePixels.subtext}</p>
        </div>
        <div className="mt-3">
          {renderTrend(kpis.activePixels.changeText, kpis.activePixels.changeDirection)}
        </div>
      </div>

      {/* Events Today */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-purple-600">Events Today</span>
            <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpis.eventsToday.count.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{kpis.eventsToday.subtext}</p>
        </div>
        <div className="mt-3">
          {renderTrend(kpis.eventsToday.changeText, kpis.eventsToday.changeDirection)}
        </div>
      </div>

      {/* Events Failed */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-red-600">Events Failed</span>
            <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpis.eventsFailed.count.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{kpis.eventsFailed.subtext}</p>
        </div>
        <div className="mt-3">
          {renderTrend(kpis.eventsFailed.changeText, kpis.eventsFailed.changeDirection)}
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-800">Success Rate</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpis.successRate.count}%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{kpis.successRate.subtext}</p>
        </div>
        <div className="mt-3">
          {renderTrend(kpis.successRate.changeText, kpis.successRate.changeDirection)}
        </div>
      </div>
    </div>
  );
};
