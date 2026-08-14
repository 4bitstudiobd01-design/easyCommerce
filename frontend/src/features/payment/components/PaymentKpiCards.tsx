'use client';

import React from 'react';
import { Wallet, CheckCircle2, Clock, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PaymentKpiMetric, PaymentSummaryResponse } from '../api/paymentApi';
import { formatCurrency, formatChangePercent } from '../utils/paymentFormatters';

interface PaymentKpiCardsProps {
  summary?: PaymentSummaryResponse;
  isLoading: boolean;
  periodLabel: string;
}

interface KpiCardConfig {
  key: keyof Pick<PaymentSummaryResponse, 'totalReceived' | 'paid' | 'pending' | 'refunded'>;
  label: string;
  icon: React.ElementType;
  iconClass: string;
  cardClass: string;
}

const CARDS: KpiCardConfig[] = [
  {
    key: 'totalReceived',
    label: 'Total Received',
    icon: Wallet,
    iconClass: 'bg-blue-600',
    cardClass: 'from-blue-50/80',
  },
  {
    key: 'paid',
    label: 'Paid',
    icon: CheckCircle2,
    iconClass: 'bg-emerald-500',
    cardClass: 'from-emerald-50/80',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: Clock,
    iconClass: 'bg-amber-500',
    cardClass: 'from-amber-50/80',
  },
  {
    key: 'refunded',
    label: 'Refunded',
    icon: RotateCcw,
    iconClass: 'bg-purple-500',
    cardClass: 'from-purple-50/80',
  },
];

const KpiCard = ({
  config,
  metric,
  currency,
  periodLabel,
}: {
  config: KpiCardConfig;
  metric: PaymentKpiMetric;
  currency: string;
  periodLabel: string;
}) => {
  const Icon = config.icon;
  const change = formatChangePercent(metric?.changePercent ?? null);
  const isPositive = (metric?.changePercent ?? 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={`bg-gradient-to-br ${config.cardClass} to-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">{config.label}</p>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {formatCurrency(metric?.amount ?? 0, currency)}
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-1">
            {(metric?.count ?? 0).toLocaleString('en-US')} transactions
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl ${config.iconClass} text-white flex items-center justify-center shrink-0 shadow-sm`}
        >
          <Icon className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center gap-1.5">
        {change === null ? (
          // No comparable baseline — never render Infinity%, NaN% or undefined%.
          <span className="text-[11px] font-medium text-slate-400">
            No comparison data
          </span>
        ) : (
          <>
            <TrendIcon
              className={`w-3.5 h-3.5 shrink-0 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
              aria-hidden="true"
            />
            <span
              className={`text-[11px] font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {isPositive ? '+' : '-'}
              {change}
            </span>
            <span className="text-[11px] font-medium text-slate-400 truncate">
              {periodLabel}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

const KpiCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
    <div className="mt-3 pt-3 border-t border-slate-200/70">
      <Skeleton className="h-3 w-28 rounded" />
    </div>
  </div>
);

export const PaymentKpiCards = ({ summary, isLoading, periodLabel }: PaymentKpiCardsProps) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map((card) => (
          <KpiCardSkeleton key={card.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map((card) => (
        <KpiCard
          key={card.key}
          config={card}
          metric={summary[card.key]}
          currency={summary.currency}
          periodLabel={periodLabel}
        />
      ))}
    </div>
  );
};
