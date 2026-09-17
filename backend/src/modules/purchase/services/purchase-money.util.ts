/**
 * Money helpers for the purchase module. Amounts are stored as numeric strings; arithmetic
 * is done in integer cents to avoid float drift, mirroring the accounting module.
 */
const CENTS = 100;

export function toCents(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 0;
  return Math.round(n * CENTS);
}

export function fromCents(cents: number): string {
  return (cents / CENTS).toFixed(2);
}
