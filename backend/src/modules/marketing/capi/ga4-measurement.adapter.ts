import { Injectable, Logger } from '@nestjs/common';
import { PixelCredentialBag } from '../services/marketing-pixel-crypto.service';
import { CapiAdapter, CapiDispatchResult, CapiEvent } from './capi-adapter.interface';
import { post } from './meta-capi.adapter';

const GA4_EVENT_MAP: Record<string, string> = {
  PageView: 'page_view',
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
};

/**
 * GA4 Measurement Protocol —
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */
@Injectable()
export class Ga4MeasurementAdapter implements CapiAdapter {
  readonly provider = 'GOOGLE_ANALYTICS' as const;
  private readonly logger = new Logger(Ga4MeasurementAdapter.name);

  canDispatch(credentials: PixelCredentialBag): boolean {
    return Boolean(credentials.apiSecret && credentials.apiSecret.trim().length > 0);
  }

  async dispatch(
    pixelId: string, // the G-XXXX measurement id
    credentials: PixelCredentialBag,
    event: CapiEvent,
  ): Promise<CapiDispatchResult> {
    const params: Record<string, unknown> = {};
    if (event.value != null) params.value = event.value;
    if (event.currency) params.currency = event.currency;
    if (event.orderRef) params.transaction_id = event.orderRef;
    if (event.contentIds?.length) {
      params.items = event.contentIds.map((id) => ({ item_id: id }));
    }
    if (event.sourceUrl) params.page_location = event.sourceUrl;

    const body = {
      // No cross-session cookie server-side — use the session id as the client id
      // so events at least group per visit.
      client_id: event.sessionId || `${Date.now()}.${Math.floor(Math.random() * 1e9)}`,
      events: [
        {
          name: GA4_EVENT_MAP[event.eventName] ?? event.eventName.toLowerCase(),
          params,
        },
      ],
    };

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
      pixelId,
    )}&api_secret=${encodeURIComponent(credentials.apiSecret as string)}`;

    // MP returns 204 No Content on success (and on most validation failures too —
    // there is no rich error unless you hit /debug/mp/collect).
    return post(url, body, this.logger, this.provider);
  }
}
