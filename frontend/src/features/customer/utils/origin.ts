import { Customer } from '../api/customerApi';

const UTM_SOURCE_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  google: 'Google',
  youtube: 'YouTube',
};

const CHANNEL_LABELS: Record<string, string> = {
  direct: 'Direct',
  organic_search: 'Organic Search',
  paid_search: 'Paid Search',
  social: 'Social',
  referral: 'Referral',
  email: 'Email',
  other: 'Other',
};

/**
 * Prefers the exact platform (from utm_source, e.g. "came from facebook")
 * over the broad channel bucket ("social") — the bucket is the fallback for
 * when a link had no utm_source, not the primary label. Mirrors the backend's
 * normalizeChannel() bucketing (backend/src/common/utils/normalize-channel.util.ts).
 */
export function getOriginLabel(customer: Pick<Customer, 'registrationUtmSource' | 'registrationChannel'>): string | null {
  if (customer.registrationUtmSource) {
    const key = customer.registrationUtmSource.toLowerCase().trim();
    return UTM_SOURCE_LABELS[key] ?? customer.registrationUtmSource;
  }
  if (customer.registrationChannel) {
    return CHANNEL_LABELS[customer.registrationChannel] ?? customer.registrationChannel;
  }
  return null;
}
