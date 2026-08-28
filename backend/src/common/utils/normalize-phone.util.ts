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

/**
 * Generates all common representation variants of a phone number so lookup queries
 * (e.g. In(getPhoneLookupVariants(phone))) reliably match customer records across
 * different formats (local 01..., international +880..., raw 880..., with dashes/spaces, etc.).
 */
export function getPhoneLookupVariants(phone: string): string[] {
  const trimmed = (phone || '').trim();
  if (!trimmed) return [];

  const rawCleaned = trimmed.replace(/[\s-]/g, '');
  const variants = new Set<string>([trimmed, rawCleaned]);

  const normalized = normalizePhone(trimmed);
  if (normalized) {
    variants.add(normalized);
  }

  // Bangladesh 11-digit local format: 01XXXXXXXXX
  const bdMatch = rawCleaned.match(/(?:(?:\+|00)?88)?(01[3-9]\d{8})/);
  if (bdMatch && bdMatch[1]) {
    const local11 = bdMatch[1]; // e.g. '01712345678'
    variants.add(local11);
    variants.add(`+88${local11}`);
    variants.add(`88${local11}`);
    variants.add(`+880${local11}`); // in case naively prefixed without stripping leading 0
    variants.add(`880${local11}`);
  } else {
    const digitsOnly = rawCleaned.replace(/\D/g, '');
    if (digitsOnly) {
      variants.add(digitsOnly);
      variants.add(`+${digitsOnly}`);
    }
  }

  return Array.from(variants);
}

