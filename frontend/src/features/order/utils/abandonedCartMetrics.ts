import type { AbandonedCart } from '../api/orderApi';
import { getItemCount } from './abandonedCartFormatters';

export interface AbandonedCartSummary {
  abandonedCarts: number;
  lostRevenue: number;
  recoveredCarts: number;
  recoveredRevenue: number;
  /** Recovered ÷ total, as a percentage. 0 when there is nothing to divide. */
  recoveryRate: number;
  remindedCarts: number;
  totalItems: number;
  currency: string;
}

export interface TrendPoint {
  /** Bucket start, used as the x-axis key. */
  date: string;
  label: string;
  count: number;
}

/**
 * Derives the dashboard's headline numbers from the cart list.
 *
 * The API exposes the cart records themselves rather than a pre-aggregated
 * summary endpoint, so every figure here is computed from the rows actually
 * loaded — there are no placeholder or synthesised values.
 */
export const buildSummary = (
  carts: AbandonedCart[],
  currency = 'BDT',
): AbandonedCartSummary => {
  let lostRevenue = 0;
  let recoveredRevenue = 0;
  let recoveredCarts = 0;
  let remindedCarts = 0;
  let totalItems = 0;

  carts.forEach((cart) => {
    const amount = Number(cart.totalAmount) || 0;
    totalItems += getItemCount(cart.itemsJson);

    if (cart.isRecovered) {
      recoveredCarts += 1;
      recoveredRevenue += amount;
    } else {
      lostRevenue += amount;
    }

    if (cart.lastRemindedAt) remindedCarts += 1;
  });

  const abandonedCarts = carts.length - recoveredCarts;

  return {
    abandonedCarts,
    lostRevenue,
    recoveredCarts,
    recoveredRevenue,
    recoveryRate: carts.length > 0 ? (recoveredCarts / carts.length) * 100 : 0,
    remindedCarts,
    totalItems,
    currency,
  };
};

/**
 * Buckets carts by calendar day for the trend sparkline. Days with no carts are
 * emitted as zeroes so the line reflects real gaps instead of skipping them.
 */
export const buildTrend = (carts: AbandonedCart[], days = 7): TrendPoint[] => {
  const buckets = new Map<string, number>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  carts.forEach((cart) => {
    const created = new Date(cart.createdAt);
    if (Number.isNaN(created.getTime())) return;
    const key = created.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    label: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    count,
  }));
};
