'use client';

import React from 'react';
import { ShoppingCart, Wallet, CheckCircle2, BadgeDollarSign, LineChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AbandonedCartSummary } from '../utils/abandonedCartMetrics';
import { formatCurrency } from '../utils/abandonedCartFormatters';

interface AbandonedCartKpiCardsProps {
  summary: AbandonedCartSummary;
  isLoading: boolean;
  periodLabel: string;
}

interface KpiCardConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  iconClass: string;
  value: string;
}

const KpiCard = ({
  config,
  periodLabel,
}: {
  config: KpiCardConfig;
  periodLabel: string;
}) => {
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs min-w-0">
      <div className="flex items-start gap-2.5">
        <div
          className={`w-8 h-8 rounded-lg ${config.iconClass} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
        </div>
        <p className="text-[11px] font-bold text-slate-500 leading-tight pt-1 truncate">
          {config.label}
        </p>
      </div>

      <p className="text-xl font-extrabold text-slate-900 tracking-tight mt-2 truncate">
        {config.value}
      </p>
      <p className="text-[10px] font-medium text-slate-400 mt-1 truncate">{periodLabel}</p>
    </div>
  );
};

const KpiCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
    <div className="flex items-start gap-2.5">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="h-3 w-20 rounded mt-1" />
    </div>
    <Skeleton className="h-6 w-24 rounded mt-2.5" />
    <Skeleton className="h-2.5 w-20 rounded mt-2" />
  </div>
);

export const AbandonedCartKpiCards = ({
  summary,
  isLoading,
  periodLabel,
}: AbandonedCartKpiCardsProps) => {
  const gridClass = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5';

  const cards: KpiCardConfig[] = [
    {
      key: 'abandonedCarts',
      label: 'Abandoned Carts',
      icon: ShoppingCart,
      iconClass: 'bg-emerald-50 text-emerald-600',
      value: summary.abandonedCarts.toLocaleString('en-US'),
    },
    {
      key: 'lostRevenue',
      label: 'Lost Revenue',
      icon: Wallet,
      iconClass: 'bg-amber-50 text-amber-600',
      value: formatCurrency(summary.lostRevenue, summary.currency),
    },
    {
      key: 'recoveredCarts',
      label: 'Recovered Carts',
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600',
      value: summary.recoveredCarts.toLocaleString('en-US'),
    },
    {
      key: 'recoveredRevenue',
      label: 'Recovered Revenue',
      icon: BadgeDollarSign,
      iconClass: 'bg-teal-50 text-teal-600',
      value: formatCurrency(summary.recoveredRevenue, summary.currency),
    },
    {
      key: 'recoveryRate',
      label: 'Recovery Rate',
      icon: LineChart,
      iconClass: 'bg-sky-50 text-sky-600',
      value: `${summary.recoveryRate.toFixed(1)}%`,
    },
  ];

  if (isLoading) {
    return (
      <div className={gridClass}>
        {cards.map((card) => (
          <KpiCardSkeleton key={card.key} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {cards.map((card) => (
        <KpiCard key={card.key} config={card} periodLabel={periodLabel} />
      ))}
    </div>
  );
};
