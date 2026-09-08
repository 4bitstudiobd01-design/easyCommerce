import { Injectable, Logger } from '@nestjs/common';
import { PixelCredentialBag } from '../services/marketing-pixel-crypto.service';
import { buildHashedUserData } from '../utils/pii-hash.util';
import { CapiAdapter, CapiDispatchResult, CapiEvent } from './capi-adapter.interface';

const GRAPH_VERSION = 'v19.0';

/** Meta Conversions API — https://developers.facebook.com/docs/marketing-api/conversions-api */
@Injectable()
export class MetaCapiAdapter implements CapiAdapter {
  readonly provider = 'META' as const;
  private readonly logger = new Logger(MetaCapiAdapter.name);

  canDispatch(credentials: PixelCredentialBag): boolean {
    return Boolean(credentials.accessToken && credentials.accessToken.trim().length > 0);
  }

  async dispatch(
    pixelId: string,
    credentials: PixelCredentialBag,
    event: CapiEvent,
  ): Promise<CapiDispatchResult> {
    const userData = {
      ...buildHashedUserData(event.user ?? {}),
      ...(event.user?.clientIp ? { client_ip_address: event.user.clientIp } : {}),
      ...(event.user?.userAgent ? { client_user_agent: event.user.userAgent } : {}),
    };

    const customData: Record<string, unknown> = {};
    if (event.value != null) customData.value = event.value;
    if (event.currency) customData.currency = event.currency;
    if (event.contentIds?.length) {
      customData.content_ids = event.contentIds;
      customData.content_type = 'product';
    }
    if (event.numItems != null) customData.num_items = event.numItems;
    if (event.orderRef) customData.order_id = event.orderRef;

    const body = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(event.eventTime.getTime() / 1000),
          action_source: 'website',
          ...(event.sourceUrl ? { event_source_url: event.sourceUrl } : {}),
          ...(event.sessionId ? { event_id: event.sessionId } : {}),
          user_data: userData,
          custom_data: customData,
        },
      ],
      ...(credentials.testEventCode ? { test_event_code: credentials.testEventCode } : {}),
    };

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(
      pixelId,
    )}/events?access_token=${encodeURIComponent(credentials.accessToken as string)}`;

    return post(url, body, this.logger, this.provider);
  }
}

export async function post(
  url: string,
  body: unknown,
  logger: Logger,
  provider: string,
  extraHeaders: Record<string, string> = {},
): Promise<CapiDispatchResult> {
  // Never log the URL (may carry the access token) or the raw body.
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(body),
    });
    const ok = res.ok;
    if (!ok) {
      let detail = '';
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        /* ignore */
      }
      logger.warn(`${provider} CAPI dispatch failed: HTTP ${res.status} ${detail}`);
      return {
        ok: false,
        httpStatus: res.status,
        sentPayload: body as Record<string, unknown>,
        errorMessage: `HTTP ${res.status}${detail ? `: ${detail}` : ''}`,
      };
    }
    return { ok: true, httpStatus: res.status, sentPayload: body as Record<string, unknown> };
  } catch (err) {
    const msg = (err as Error).message;
    logger.warn(`${provider} CAPI dispatch threw: ${msg}`);
    return {
      ok: false,
      httpStatus: null,
      sentPayload: body as Record<string, unknown>,
      errorMessage: msg,
    };
  }
}
