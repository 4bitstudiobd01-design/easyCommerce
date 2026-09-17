import { Injectable, Logger } from '@nestjs/common';
import { PixelCredentialBag } from '../services/marketing-pixel-crypto.service';
import { hashEmail, hashPhone } from '../utils/pii-hash.util';
import { CapiAdapter, CapiDispatchResult, CapiEvent } from './capi-adapter.interface';
import { post } from './meta-capi.adapter';

const TIKTOK_EVENT_MAP: Record<string, string> = {
  PageView: 'Pageview',
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  Purchase: 'CompletePayment',
};

/** TikTok Events API 2.0 — https://business-api.tiktok.com/portal/docs?id=1771101027431425 */
@Injectable()
export class TiktokEventsAdapter implements CapiAdapter {
  readonly provider = 'TIKTOK' as const;
  private readonly logger = new Logger(TiktokEventsAdapter.name);

  canDispatch(credentials: PixelCredentialBag): boolean {
    return Boolean(credentials.accessToken && credentials.accessToken.trim().length > 0);
  }

  async dispatch(
    pixelId: string,
    credentials: PixelCredentialBag,
    event: CapiEvent,
  ): Promise<CapiDispatchResult> {
    const properties: Record<string, unknown> = {};
    if (event.value != null) properties.value = event.value;
    if (event.currency) properties.currency = event.currency;
    if (event.contentIds?.length) {
      properties.contents = event.contentIds.map((id) => ({ content_id: id }));
      properties.content_type = 'product';
    }
    if (event.orderRef) properties.order_id = event.orderRef;

    const body = {
      event_source: 'web',
      event_source_id: pixelId,
      data: [
        {
          event: TIKTOK_EVENT_MAP[event.eventName] ?? event.eventName,
          event_time: Math.floor(event.eventTime.getTime() / 1000),
          ...(event.sessionId ? { event_id: event.sessionId } : {}),
          user: {
            ...(hashEmail(event.user?.email) ? { email: hashEmail(event.user?.email) } : {}),
            ...(hashPhone(event.user?.phone) ? { phone: hashPhone(event.user?.phone) } : {}),
            ...(event.user?.clientIp ? { ip: event.user.clientIp } : {}),
            ...(event.user?.userAgent ? { user_agent: event.user.userAgent } : {}),
          },
          page: event.sourceUrl ? { url: event.sourceUrl } : undefined,
          properties,
        },
      ],
    };

    return post(
      'https://business-api.tiktok.com/open_api/v1.3/event/track/',
      body,
      this.logger,
      this.provider,
      { 'Access-Token': credentials.accessToken as string },
    );
  }
}
