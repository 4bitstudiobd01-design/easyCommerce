import { Injectable, Logger } from '@nestjs/common';
import { PixelCredentialBag } from '../services/marketing-pixel-crypto.service';
import { hashEmail, hashPhone } from '../utils/pii-hash.util';
import { CapiAdapter, CapiDispatchResult, CapiEvent } from './capi-adapter.interface';
import { post } from './meta-capi.adapter';

/**
 * Google Ads server-side conversions (Enhanced Conversions for Leads via the
 * Google Ads API). Needs OAuth (`clientId` + `clientSecret` + `refreshToken`) and
 * a `developerToken`; the pixel's `pixelId` here is the customer/conversion id.
 *
 * Built now so the wiring exists, but only exercised when a merchant supplies the
 * full OAuth set — most stores won't, and that is fine (see workflow decision #2).
 * The access-token exchange is done per dispatch (no caching yet); a failure at
 * any step returns a `CapiDispatchResult` with `ok:false`, never throws.
 */
@Injectable()
export class GoogleAdsCapiAdapter implements CapiAdapter {
  readonly provider = 'GOOGLE_ADS' as const;
  private readonly logger = new Logger(GoogleAdsCapiAdapter.name);

  canDispatch(credentials: PixelCredentialBag): boolean {
    return Boolean(
      credentials.developerToken &&
        credentials.clientId &&
        credentials.clientSecret &&
        credentials.refreshToken,
    );
  }

  async dispatch(
    pixelId: string,
    credentials: PixelCredentialBag,
    event: CapiEvent,
  ): Promise<CapiDispatchResult> {
    // 1. Exchange the refresh token for an access token.
    let accessToken: string;
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: credentials.clientId as string,
          client_secret: credentials.clientSecret as string,
          refresh_token: credentials.refreshToken as string,
          grant_type: 'refresh_token',
        }),
      });
      if (!tokenRes.ok) {
        const detail = (await tokenRes.text()).slice(0, 200);
        return {
          ok: false,
          httpStatus: tokenRes.status,
          sentPayload: { step: 'oauth' },
          errorMessage: `OAuth token exchange failed: HTTP ${tokenRes.status} ${detail}`,
        };
      }
      accessToken = (await tokenRes.json()).access_token;
    } catch (err) {
      return {
        ok: false,
        httpStatus: null,
        sentPayload: { step: 'oauth' },
        errorMessage: `OAuth token exchange threw: ${(err as Error).message}`,
      };
    }

    // 2. Upload the click conversion. `pixelId` is expected as
    //    "<customerId>/<conversionActionId>".
    const [customerId, conversionActionId] = pixelId.split('/');
    const body = {
      conversions: [
        {
          conversionAction: conversionActionId
            ? `customers/${customerId}/conversionActions/${conversionActionId}`
            : undefined,
          conversionDateTime: formatGoogleAdsTimestamp(event.eventTime),
          conversionValue: event.value,
          currencyCode: event.currency,
          orderId: event.orderRef,
          userIdentifiers: [
            ...(hashEmail(event.user?.email)
              ? [{ hashedEmail: hashEmail(event.user?.email) }]
              : []),
            ...(hashPhone(event.user?.phone)
              ? [{ hashedPhoneNumber: hashPhone(event.user?.phone) }]
              : []),
          ],
        },
      ],
      partialFailure: true,
    };

    const url = `https://googleads.googleapis.com/v17/customers/${customerId}:uploadClickConversions`;
    return post(url, body, this.logger, this.provider, {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': credentials.developerToken as string,
    });
  }
}

function formatGoogleAdsTimestamp(d: Date): string {
  // "yyyy-mm-dd hh:mm:ss+00:00"
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '+00:00');
}
