'use client';

import React from 'react';
import {
  ArrowLeftRight,
  Wallet,
  CheckCircle2,
  RotateCcw,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { TransactionKpiItem } from './types';

interface TransactionsKpiCardsProps {
  kpis: TransactionKpiItem[];
}

export function TransactionsKpiCards({ kpis }: TransactionsKpiCardsProps) {
  const renderIcon = (type: TransactionKpiItem['iconType']) => {
    switch (type) {
      case 'total':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        );
      case 'amount':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        );
      case 'success':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'refund':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
        );
      case 'failed':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          {/* Top: Icon & Title */}
          <div className="flex items-center gap-3">
            {renderIcon(kpi.iconType)}
            <span className="text-xs font-semibold text-slate-500">
              {kpi.title}
            </span>
          </div>

          {/* Middle: Big Value */}
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpi.value}
            </div>
          </div>

          {/* Bottom: Trend and Subtext */}
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            {kpi.trendType === 'up' ? (
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <span>↑</span>
                <span>{kpi.trend}</span>
              </span>
            ) : (
              <span className="font-bold text-rose-500 flex items-center gap-0.5">
                <span>↓</span>
                <span>{kpi.trend}</span>
              </span>
            )}
            <span className="text-slate-400 font-normal">{kpi.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
