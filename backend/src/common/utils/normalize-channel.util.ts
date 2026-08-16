/**
 * Canonical marketing-channel buckets used across orders and storefront
 * sessions so the two can be grouped/joined on identical labels. Both
 * `CreateOrderService` and `RecordVisitService` normalize through this
 * helper rather than trusting the client-resolved bucket outright — the
 * client sends its best guess (see frontend attribution.ts) but the server
 * re-derives the final value from the raw referrer/UTM fields.
 */
export const CHANNEL_VALUES = [
  'direct',
  'organic_search',
  'paid_search',
  'social',
  'referral',
  'email',
  'other',
] as const;

export type Channel = (typeof CHANNEL_VALUES)[number];

const SOCIAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'pinterest.com',
  'youtube.com',
];

const SEARCH_HOSTS = ['google.', 'bing.com', 'yahoo.com', 'duckduckgo.com'];

function hostMatches(host: string, needles: string[]): boolean {
  return needles.some((needle) => host.includes(needle));
}

/**
 * Re-derives the normalized channel bucket from raw attribution fields.
 * `requestedChannel` (if the client already resolved one) is only trusted
 * when it's a known value; anything else falls through to server-side
 * re-derivation from UTM/referrer so a client can't inject an arbitrary label.
 */
export function normalizeChannel(input: {
  requestedChannel?: string;
  utmSource?: string;
  utmMedium?: string;
  referrerHost?: string;
}): Channel {
  const { requestedChannel, utmSource, utmMedium, referrerHost } = input;

  if (requestedChannel && (CHANNEL_VALUES as readonly string[]).includes(requestedChannel)) {
    return requestedChannel as Channel;
  }

  const medium = utmMedium?.toLowerCase().trim();
  const source = utmSource?.toLowerCase().trim();
  const host = referrerHost?.toLowerCase().trim() || '';

  if (medium === 'cpc' || medium === 'ppc' || medium === 'paid') return 'paid_search';
  if (medium === 'email') return 'email';
  if (medium === 'social' || hostMatches(host, SOCIAL_HOSTS)) return 'social';
  if (source || medium) return 'other';
  if (!host) return 'direct';
  if (hostMatches(host, SEARCH_HOSTS)) return 'organic_search';

  return 'referral';
}
