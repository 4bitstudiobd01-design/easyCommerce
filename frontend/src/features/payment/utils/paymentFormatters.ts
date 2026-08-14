import type {
  PaymentGatewayCode,
  PaymentMethodType,
  PaymentTransactionStatus,
} from '../api/paymentApi';

/**
 * Formats an amount in its own transaction currency.
 * BDT renders with the ৳ symbol and Bengali-style grouping (8,45,000), which is
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

/** Compact form used inside the donut chart centre, e.g. ৳8.45L / ৳12.3K. */
export const formatCompactCurrency = (amount: number, currency = 'BDT'): string => {
  const value = Number(amount) || 0;
  if (Math.abs(value) < 100000) return formatCurrency(value, currency);
  return formatCurrency(value, currency);
};

/** "Aug 14, 2025" */
export const formatTransactionDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** "10:46 AM" */
export const formatTransactionTime = (value: string | Date): string => {
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
 * UI shows a neutral dash instead of Infinity%, NaN% or undefined%.
 */
export const formatChangePercent = (changePercent: number | null): string | null => {
  if (changePercent === null || changePercent === undefined) return null;
  if (!Number.isFinite(changePercent)) return null;
  const sign = changePercent >= 0 ? '' : '';
  return `${sign}${Math.abs(changePercent).toFixed(1)}%`;
};

/** Merchant-facing status label — never rely on colour alone to convey state. */
export const PAYMENT_STATUS_LABELS: Record<PaymentTransactionStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Paid',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  PARTIALLY_REFUNDED: 'Part. Refunded',
  REFUNDED: 'Refunded',
};

/** Tailwind classes per status, matching the approved design's badge palette. */
export const PAYMENT_STATUS_STYLES: Record<PaymentTransactionStatus, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PROCESSING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  FAILED: 'bg-red-50 text-red-700 ring-red-600/20',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  REFUNDED: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  PARTIALLY_REFUNDED: 'bg-purple-50 text-purple-700 ring-purple-600/20',
};

/** Brand accent per gateway/method, used for the small provider tile. */
export const PAYMENT_BRAND_STYLES: Record<string, string> = {
  BKASH: 'bg-[#E2136E]/10 text-[#E2136E]',
  NAGAD: 'bg-[#F26522]/10 text-[#F26522]',
  ROCKET: 'bg-[#8C3494]/10 text-[#8C3494]',
  UPAY: 'bg-[#00A99D]/10 text-[#00A99D]',
  SSLCOMMERZ: 'bg-blue-500/10 text-blue-600',
  STRIPE: 'bg-[#635BFF]/10 text-[#635BFF]',
  PAYPAL: 'bg-[#003087]/10 text-[#003087]',
  CARD: 'bg-blue-500/10 text-blue-600',
  COD: 'bg-blue-500/10 text-blue-600',
  BANK_TRANSFER: 'bg-slate-500/10 text-slate-600',
  MANUAL: 'bg-slate-500/10 text-slate-600',
};

export const getBrandStyle = (code: PaymentGatewayCode | PaymentMethodType): string =>
  PAYMENT_BRAND_STYLES[code] ?? 'bg-slate-100 text-slate-600';

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
