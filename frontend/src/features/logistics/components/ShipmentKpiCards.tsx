'use client';

import React from 'react';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  RotateCcw,
  BadgeDollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ShipmentKpiMetric, ShipmentSummary } from '../api/logisticsApi';
import { formatCurrency, formatChangePercent } from '../utils/shipmentFormatters';

interface ShipmentKpiCardsProps {
  summary?: ShipmentSummary;
  isLoading: boolean;
  periodLabel: string;
}

type MetricKey = keyof Pick<
  ShipmentSummary,
  | 'totalShipments'
  | 'pending'
  | 'inTransit'
  | 'delivered'
  | 'returned'
  | 'codCollected'
  | 'codPending'
>;

interface KpiCardConfig {
  key: MetricKey;
  label: string;
  caption: string;
  icon: React.ElementType;
  iconClass: string;
  /** Money KPIs render a formatted amount; the rest render a count. */
  isCurrency?: boolean;
}

const CARDS: KpiCardConfig[] = [
  {
    key: 'totalShipments',
    label: 'Total Shipments',
    caption: 'All shipments',
    icon: Package,
    iconClass: 'bg-blue-50 text-blue-600',
  },
  {
    key: 'pending',
    label: 'Pending',
    caption: 'Awaiting pickup',
    icon: Clock,
    iconClass: 'bg-amber-50 text-amber-600',
  },
  {
    key: 'inTransit',
    label: 'In Transit',
    caption: 'On the way',
    icon: Truck,
    iconClass: 'bg-indigo-50 text-indigo-600',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    caption: 'Successfully delivered',
    icon: CheckCircle2,
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    key: 'returned',
    label: 'Returned',
    caption: 'Returned to sender',
    icon: RotateCcw,
    iconClass: 'bg-red-50 text-red-600',
  },
  {
    key: 'codCollected',
    label: 'COD Collected',
    caption: 'This month',
    icon: BadgeDollarSign,
    iconClass: 'bg-emerald-50 text-emerald-600',
    isCurrency: true,
  },
  {
    key: 'codPending',
    label: 'COD Pending',
    caption: 'Pending settlement',
    icon: Wallet,
    iconClass: 'bg-orange-50 text-orange-600',
    isCurrency: true,
  },
];

const KpiCard = ({
  config,
  metric,
  currency,
  periodLabel,
}: {
  config: KpiCardConfig;
  metric?: ShipmentKpiMetric;
  currency: string;
  periodLabel: string;
}) => {
  const Icon = config.icon;
  const change = formatChangePercent(metric?.changePercent ?? null);
  const isPositive = (metric?.changePercent ?? 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const value = config.isCurrency
    ? formatCurrency(metric?.amount ?? 0, currency)
    : (metric?.count ?? 0).toLocaleString('en-US');

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs min-w-0">
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[11px] font-bold text-slate-500 truncate leading-tight">
          {config.label}
        </p>
        <div
          className={`w-6 h-6 rounded-lg ${config.iconClass} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
        </div>
      </div>

      <p className="text-lg font-extrabold text-slate-900 tracking-tight mt-1.5 truncate">
        {value}
      </p>
      <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{config.caption}</p>

      <div className="mt-1.5 flex items-center gap-0.5 min-w-0">
        {change === null ? (
          // No comparable baseline — never render Infinity%, NaN% or undefined%.
          <span className="text-[10px] font-medium text-slate-400 truncate">No prior data</span>
        ) : (
          <>
            <TrendIcon
              className={`w-3 h-3 shrink-0 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
              aria-hidden="true"
            />
            <span
              className={`text-[10px] font-bold shrink-0 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {isPositive ? '+' : '-'}
              {change}
            </span>
            <span className="text-[10px] font-medium text-slate-400 truncate">{periodLabel}</span>
          </>
        )}
      </div>
    </div>
  );
};

const KpiCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
    <div className="flex items-start justify-between gap-2">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className="w-7 h-7 rounded-lg" />
    </div>
    <Skeleton className="h-6 w-24 rounded mt-1.5" />
    <Skeleton className="h-2.5 w-16 rounded mt-1.5" />
    <Skeleton className="h-2.5 w-24 rounded mt-2.5" />
  </div>
);

export const ShipmentKpiCards = ({
  summary,
  isLoading,
  periodLabel,
}: ShipmentKpiCardsProps) => {
  // The approved design puts all seven KPIs on one row, so the full set stays
  // visible without scrolling; narrower screens fall back to fewer columns.
  const gridClass = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5';

  if (isLoading || !summary) {
    return (
      <div className={gridClass}>
        {CARDS.map((card) => (
          <KpiCardSkeleton key={card.key} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
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
