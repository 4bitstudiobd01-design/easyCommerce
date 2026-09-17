import { PixelCredentialBag } from '../services/marketing-pixel-crypto.service';

/** Normalised event the marketing module hands every provider adapter. */
export interface CapiEvent {
  eventName: string; // PageView | ViewContent | AddToCart | InitiateCheckout | Purchase
  eventTime: Date;
  /** Where the visitor was (product URL etc.), for event_source_url. */
  sourceUrl?: string;
  /** Storefront session id, for dedup / event_id. */
  sessionId?: string;
  orderId?: string;
  orderRef?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  numItems?: number;
  /** Raw (unhashed) customer identifiers — the adapter hashes before sending. */
  user?: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    clientIp?: string | null;
    userAgent?: string | null;
  };
}

export interface CapiDispatchResult {
  ok: boolean;
  httpStatus: number | null;
  /** What was actually POSTed (PII already hashed) — stored on the event log. */
  sentPayload: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * One implementation per ad platform. Each is exercised only when the pixel has
 * the credentials it needs (`canDispatch`). No shared HTTP client — a small
 * `fetch` per adapter keeps them independent and dependency-free.
 */
export interface CapiAdapter {
  readonly provider: 'META' | 'GOOGLE_ANALYTICS' | 'GOOGLE_ADS' | 'TIKTOK';

  /** True when `credentials` carries everything this provider's API needs. */
  canDispatch(credentials: PixelCredentialBag): boolean;

  dispatch(
    pixelId: string,
    credentials: PixelCredentialBag,
    event: CapiEvent,
  ): Promise<CapiDispatchResult>;
}

export const CAPI_ADAPTERS = Symbol('CAPI_ADAPTERS');
