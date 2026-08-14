import type { CodStatus, CourierProvider, ShipmentStatus } from '../api/logisticsApi';

/**
 * Formats an amount in its own currency.
 * BDT renders with the ৳ symbol and Bengali-style grouping (9,80,000), which is
 * what merchants expect locally; other currencies fall back to their own locale
 * rules so the dashboard is not hardcoded to Bangladesh.
 */
export const formatCurrency = (amount: number, currency = 'BDT'): string => {
  const value = Number(amount) || 0;

  if (currency === 'BDT') {
    return `৳${value.toLocaleString('en-IN', {
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
      minimumFractionDigits: 0,
    })}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    // Unknown ISO code — show the code rather than throwing.
    return `${currency} ${value.toLocaleString('en-US')}`;
  }
};

/** "Aug 14, 2025" */
export const formatShipmentDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** "10:46 AM" */
export const formatShipmentTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Renders a KPI delta. Returns null when there is no comparable baseline so the
 * UI shows a neutral note instead of Infinity%, NaN% or undefined%.
 */
export const formatChangePercent = (changePercent: number | null): string | null => {
  if (changePercent === null || changePercent === undefined) return null;
  if (!Number.isFinite(changePercent)) return null;
  return `${Math.abs(changePercent).toFixed(1)}%`;
};

/**
 * Tailwind classes per shipment status, matching the approved design's badge
 * palette. The label is always rendered alongside, so colour is never the only
 * carrier of meaning.
 */
export const SHIPMENT_STATUS_STYLES: Record<ShipmentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  BOOKED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  PICKED_UP: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  OUT_FOR_DELIVERY: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DELIVERY_FAILED: 'bg-red-50 text-red-700 ring-red-600/20',
  RETURNING: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  RETURNED: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export const COD_STATUS_STYLES: Record<CodStatus, string> = {
  NOT_APPLICABLE: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-amber-50 text-amber-700',
  COLLECTED: 'bg-emerald-50 text-emerald-700',
  SETTLED: 'bg-blue-50 text-blue-700',
  RETURNED: 'bg-purple-50 text-purple-700',
};

/** Brand accent per courier, used for the small provider tile in the table. */
export const COURIER_BRAND_STYLES: Record<CourierProvider, string> = {
  STEADFAST: 'bg-emerald-500/10 text-emerald-600',
  PATHAO: 'bg-[#E2136E]/10 text-[#E2136E]',
  REDX: 'bg-red-500/10 text-red-600',
  PAPERFLY: 'bg-violet-500/10 text-violet-600',
};

export const getCourierBrandStyle = (provider: CourierProvider): string =>
  COURIER_BRAND_STYLES[provider] ?? 'bg-slate-100 text-slate-600';

/** Two-letter avatar initials for the customer cell. */
export const getInitials = (name: string): string => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/** Deterministic avatar tint so a customer keeps the same colour across renders. */
export const getAvatarColor = (seed: string): string => {
  const palette = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
  ];
  let hash = 0;
  for (let i = 0; i < (seed || '').length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
};

/** Donut slice colours, aligned with the status badge palette. */
export const OVERVIEW_SLICE_COLORS: Record<string, string> = {
  Delivered: '#10b981',
  'In Transit': '#3b82f6',
  Pending: '#f59e0b',
  Returned: '#a855f7',
  Failed: '#ef4444',
};

/** The merchant's own timezone, so "today" means their calendar day. */
export const resolveTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
  } catch {
    return 'Asia/Dhaka';
  }
};
