/**
 * Client-side first-touch attribution capture. Mirrors the channel-bucketing
 * rules in backend/src/common/utils/normalize-channel.util.ts — the server
 * re-derives the final channel from these raw fields rather than trusting the
 * client's resolved value outright, but sends the client's best guess too so
 * a value is present even before the round-trip.
 */

export const ATTRIBUTION_STORAGE_KEY = 'ec_attribution';
export const SESSION_ID_STORAGE_KEY = 'ec_session_id';
const CAPTURED_FLAG_KEY = 'ec_attribution_captured';

export interface ResolvedAttribution {
  channel: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerHost?: string;
  landingPage?: string;
}

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

function resolveChannel(params: {
  utmSource?: string;
  utmMedium?: string;
  referrerHost?: string;
}): string {
  const medium = params.utmMedium?.toLowerCase().trim();
  const source = params.utmSource?.toLowerCase().trim();
  const host = params.referrerHost?.toLowerCase().trim() || '';

  if (medium === 'cpc' || medium === 'ppc' || medium === 'paid') return 'paid_search';
  if (medium === 'email') return 'email';
  if (medium === 'social' || hostMatches(host, SOCIAL_HOSTS)) return 'social';
  if (source || medium) return 'other';
  if (!host) return 'direct';
  if (hostMatches(host, SEARCH_HOSTS)) return 'organic_search';

  return 'referral';
}

/**
 * Resolves attribution from the current URL's UTM params and document.referrer.
 * Does not read/write storage — callers decide persistence.
 */
export function resolveAttributionFromEnvironment(): ResolvedAttribution {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source') || undefined;
  const utmMedium = params.get('utm_medium') || undefined;
  const utmCampaign = params.get('utm_campaign') || undefined;

  let referrerHost: string | undefined;
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : undefined;
  } catch {
    referrerHost = undefined;
  }

  // A referrer pointing back at this same app is internal navigation, not a
  // real external traffic source.
  if (referrerHost && referrerHost === window.location.hostname) {
    referrerHost = undefined;
  }

  return {
    channel: resolveChannel({ utmSource, utmMedium, referrerHost }),
    utmSource,
    utmMedium,
    utmCampaign,
    referrerHost,
    landingPage: window.location.pathname,
  };
}

/**
 * First-touch-per-browser-session capture: resolves attribution once and
 * persists it to sessionStorage, guarded so later internal navigation within
 * the storefront doesn't overwrite the original referrer/UTM with an
 * internal one. Returns the (possibly previously captured) attribution.
 */
export function captureFirstTouchAttribution(): ResolvedAttribution {
  const alreadyCaptured = sessionStorage.getItem(CAPTURED_FLAG_KEY);
  if (alreadyCaptured) {
    const stored = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as ResolvedAttribution;
      } catch {
        // fall through to re-resolve
      }
    }
  }

  const resolved = resolveAttributionFromEnvironment();
  sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(resolved));
  sessionStorage.setItem(CAPTURED_FLAG_KEY, '1');
  return resolved;
}

/** Reuses the session's id if one was already generated, otherwise creates one. */
export function getOrCreateSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  sessionStorage.setItem(SESSION_ID_STORAGE_KEY, generated);
  return generated;
}

/** Reads back whatever was captured earlier in the session, for checkout to attach to the order. */
export function readStoredAttribution(): ResolvedAttribution | null {
  const stored = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ResolvedAttribution;
  } catch {
    return null;
  }
}

export function readStoredSessionId(): string | null {
  return sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
}

const TRACKING_ENDPOINT = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/orders').replace('/orders', '')}/tracking/visit`;

/**
 * Resolves/persists first-touch attribution + session id and sends a single
 * best-effort beacon to record the visit. Call once per storefront page
 * mount (see AttributionCapture) — never on every internal route change.
 */
export function recordStorefrontVisit(storeSlug: string): void {
  if (!storeSlug || typeof window === 'undefined') return;

  const attribution = captureFirstTouchAttribution();
  const sessionId = getOrCreateSessionId();

  const payload = JSON.stringify({
    sessionId,
    storeSlug,
    channel: attribution.channel,
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    referrerHost: attribution.referrerHost,
    landingPage: attribution.landingPage,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(TRACKING_ENDPOINT, blob);
  } else {
    fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Best-effort tracking; a failed beacon should never affect the storefront.
    });
  }
}
