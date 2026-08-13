/**
 * Money helpers for customer read-models.
 *
 * Order money columns are Postgres `numeric`, which the driver returns as strings to
 * preserve precision. Coercing with Number() is safe for the magnitudes involved here,
 * but the result must be rounded to 2 decimal places rather than to whole units —
 * rounding to integers silently discards poisha and stops customer totals reconciling
 * against the underlying order totals.
 */

/** Coerce a driver-returned numeric (string | number | null) to a finite number. */
export function toAmount(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

/** Round a monetary amount to 2 decimal places. */
export function roundMoney(value: unknown): number {
  const amount = toAmount(value);
  return Math.round(amount * 100) / 100;
}

/** Safe average that rounds to 2 decimal places and avoids divide-by-zero. */
export function averageMoney(total: unknown, count: number): number {
  if (!count || count <= 0) return 0;
  return roundMoney(toAmount(total) / count);
}
