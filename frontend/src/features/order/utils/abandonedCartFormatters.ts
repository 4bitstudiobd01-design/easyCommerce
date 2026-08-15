import type { AbandonedCart } from '../api/orderApi';

/** Recovery states a cart can be in, derived from the fields the API returns. */
export type AbandonedCartStatus = 'RECOVERED' | 'REMINDED' | 'ABANDONED';

/**
 * Formats an amount in its own currency. BDT renders with the ৳ symbol and
 * Bengali-style grouping (4,65,400), which is what merchants expect locally.
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
export const formatDate = (value?: string | Date | null): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** "10:30 AM" */
export const formatTime = (value?: string | Date | null): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * "2h ago" / "15h ago" / "3d ago". Abandonment is time-sensitive — a merchant
 * decides who to chase from how stale the cart is, so this reads at a glance.
 */
export const formatRelativeTime = (value?: string | Date | null): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
};

/** Renders a KPI delta; null when there is no comparable baseline. */
export const formatChangePercent = (changePercent: number | null): string | null => {
  if (changePercent === null || changePercent === undefined) return null;
  if (!Number.isFinite(changePercent)) return null;
  return `${Math.abs(changePercent).toFixed(1)}%`;
};

/** Initials for the customer avatar — "Rahim Hossain" → "RH". */
export const getInitials = (name?: string): string => {
  const trimmed = (name || '').trim();
  if (!trimmed) return '??';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/**
 * Deterministic avatar tint. Colour carries no meaning here, so it is keyed off
 * the cart id purely to keep each customer visually distinct between renders.
 */
const AVATAR_TINTS = [
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
];

export const getAvatarTint = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
};

/** A cart is recovered, else reminded once SMS went out, else plain abandoned. */
export const getCartStatus = (cart: AbandonedCart): AbandonedCartStatus => {
  if (cart.isRecovered) return 'RECOVERED';
  if (cart.lastRemindedAt) return 'REMINDED';
  return 'ABANDONED';
};

export const STATUS_STYLES: Record<
  AbandonedCartStatus,
  { label: string; className: string }
> = {
  RECOVERED: {
    label: 'Recovered',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  REMINDED: {
    label: 'SMS Sent',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  ABANDONED: {
    label: 'Abandoned',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

/** Total units across a cart's line items, tolerant of loose item shapes. */
export const getItemCount = (items: unknown[]): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce<number>((sum, item) => {
    const quantity = Number((item as { quantity?: unknown })?.quantity);
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
  }, 0);
};

/** Best-effort title for a line item across the shapes the tracker may send. */
export const getItemTitle = (item: unknown): string => {
  const record = item as Record<string, unknown> | null;
  const title = record?.title ?? record?.productTitle ?? record?.name;
  return typeof title === 'string' && title.trim() ? title : 'Item';
};
