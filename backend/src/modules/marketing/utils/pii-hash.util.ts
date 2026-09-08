import { createHash } from 'crypto';

/**
 * Meta / TikTok / GA4 server-side APIs require user identifiers (email, phone,
 * name, city, …) to be SHA-256 hashed, lower-cased and trimmed first. This helper
 * normalises exactly as the providers document so a raw PII value never leaves
 * the server.
 */

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** email → trim, lowercase, sha256. Returns undefined for an empty input. */
export function hashEmail(email?: string | null): string | undefined {
  const v = (email ?? '').trim().toLowerCase();
  if (!v || !v.includes('@')) return undefined;
  return sha256(v);
}

/**
 * phone → digits only, keep leading country code (assume BD `880` when a local
 * `01…` number is passed), then sha256.
 */
export function hashPhone(phone?: string | null): string | undefined {
  let digits = (phone ?? '').replace(/[^\d]/g, '');
  if (!digits) return undefined;
  if (digits.startsWith('0') && digits.length === 11) digits = `88${digits}`;
  if (digits.length === 10) digits = `880${digits}`;
  return sha256(digits);
}

/** generic free-text field (first name, last name, city, state, country) */
export function hashText(value?: string | null): string | undefined {
  const v = (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!v) return undefined;
  return sha256(v);
}

export interface HashedUserData {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  country?: string;
}

/** Build Meta-style hashed `user_data`. Only present fields are included. */
export function buildHashedUserData(input: {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}): HashedUserData {
  const out: HashedUserData = {};
  const em = hashEmail(input.email);
  const ph = hashPhone(input.phone);
  const fn = hashText(input.firstName);
  const ln = hashText(input.lastName);
  const ct = hashText(input.city);
  const st = hashText(input.state);
  const country = hashText(input.country);
  if (em) out.em = em;
  if (ph) out.ph = ph;
  if (fn) out.fn = fn;
  if (ln) out.ln = ln;
  if (ct) out.ct = ct;
  if (st) out.st = st;
  if (country) out.country = country;
  return out;
}
