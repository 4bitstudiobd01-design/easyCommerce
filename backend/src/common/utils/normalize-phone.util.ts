/**
 * Canonical phone storage format for the platform is the international form
 * (e.g. +8801700000000). Registration normalizes before persisting and login
 * normalizes before lookup, so both sides must use this single helper.
 *
 * Bangladesh local numbers (01XXXXXXXXX) are promoted to +880. Numbers that
 * already carry a country code are kept as-is, which keeps the helper usable
 * for the "global ready" case.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.trim().replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) {
    return digits;
  }

  if (digits.startsWith('880')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+880${digits.slice(1)}`;
  }

  return digits;
}
