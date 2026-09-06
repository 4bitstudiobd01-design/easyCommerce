'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

export type RangePresetKey =
  | 'today'
  | 'last7'
  | 'last30'
  | 'last90'
  | 'thisMonth'
  | 'custom';

export type CompareKey = 'previous' | 'previousYear' | 'none';

export interface AnalyticsFilters {
  /** ISO date strings (start of day / end of day) sent to the API. */
  dateFrom: string;
  dateTo: string;
  /** Days span of the current range — used by trend endpoints that take `days`. */
  days: number;
  rangeKey: RangePresetKey;
  rangeLabel: string;
  compareKey: CompareKey;
  compareLabel: string;
  customFrom: string;
  customTo: string;
  setRange: (key: RangePresetKey) => void;
  setCustomRange: (from: string, to: string) => void;
  setCompare: (key: CompareKey) => void;
}

const AnalyticsFiltersContext = createContext<AnalyticsFilters | null>(null);

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const fmtShort = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const RANGE_LABELS: Record<RangePresetKey, string> = {
  today: 'Today',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  last90: 'Last 90 days',
  thisMonth: 'This month',
  custom: 'Custom range',
};

const COMPARE_LABELS: Record<CompareKey, string> = {
  previous: 'Previous period',
  previousYear: 'Previous year',
  none: 'No comparison',
};

function resolveRange(
  key: RangePresetKey,
  customFrom: string,
  customTo: string,
): { from: Date; to: Date } {
  const now = new Date();
  switch (key) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'last30':
      return { from: startOfDay(new Date(now.getTime() - 29 * 864e5)), to: endOfDay(now) };
    case 'last90':
      return { from: startOfDay(new Date(now.getTime() - 89 * 864e5)), to: endOfDay(now) };
    case 'thisMonth':
      return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) };
    case 'custom': {
      const from = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(new Date(now.getTime() - 6 * 864e5));
      const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      return from <= to ? { from, to } : { from: to, to: from };
    }
    case 'last7':
    default:
      return { from: startOfDay(new Date(now.getTime() - 6 * 864e5)), to: endOfDay(now) };
  }
}

export function AnalyticsFiltersProvider({ children }: { children: React.ReactNode }) {
  const [rangeKey, setRangeKey] = useState<RangePresetKey>('last7');
  const [compareKey, setCompareKey] = useState<CompareKey>('previous');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const value = useMemo<AnalyticsFilters>(() => {
    const { from, to } = resolveRange(rangeKey, customFrom, customTo);
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 864e5) + 1);
    const rangeLabel =
      rangeKey === 'custom' && (customFrom || customTo)
        ? `${fmtShort(from)} – ${fmtShort(to)}`
        : RANGE_LABELS[rangeKey];

    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      days,
      rangeKey,
      rangeLabel,
      compareKey,
      compareLabel: COMPARE_LABELS[compareKey],
      customFrom,
      customTo,
      setRange: setRangeKey,
      setCustomRange: (f, t) => {
        setCustomFrom(f);
        setCustomTo(t);
        setRangeKey('custom');
      },
      setCompare: setCompareKey,
    };
  }, [rangeKey, compareKey, customFrom, customTo]);

  return (
    <AnalyticsFiltersContext.Provider value={value}>{children}</AnalyticsFiltersContext.Provider>
  );
}

export function useAnalyticsFilters(): AnalyticsFilters {
  const ctx = useContext(AnalyticsFiltersContext);
  if (!ctx) {
    throw new Error('useAnalyticsFilters must be used within an AnalyticsFiltersProvider');
  }
  return ctx;
}

/** The `{ dateFrom, dateTo }` slice most analytics queries take. */
export function useAnalyticsDateParams(): { dateFrom: string; dateTo: string } {
  const { dateFrom, dateTo } = useAnalyticsFilters();
  return { dateFrom, dateTo };
}

/**
 * `{ dateFrom, dateTo, compare }` for the overview endpoint. `compare: 'none'`
 * is sent as 'previous' (the API always computes one comparison window); the
 * charts hide the overlay themselves when the user picked "No comparison".
 */
export function useAnalyticsOverviewParams(): {
  dateFrom: string;
  dateTo: string;
  compare: 'previous' | 'previousYear';
} {
  const { dateFrom, dateTo, compareKey } = useAnalyticsFilters();
  return {
    dateFrom,
    dateTo,
    compare: compareKey === 'previousYear' ? 'previousYear' : 'previous',
  };
}

/** True when the user wants a period-over-period comparison overlay shown. */
export function useAnalyticsShowComparison(): boolean {
  return useAnalyticsFilters().compareKey !== 'none';
}
