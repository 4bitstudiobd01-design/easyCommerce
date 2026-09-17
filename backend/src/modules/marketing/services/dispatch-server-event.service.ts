import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm';
import { MarketingPixel } from '../entities/marketing-pixel.entity';
import { MarketingPixelPageRule } from '../entities/marketing-pixel-page-rule.entity';
import {
  MarketingEventLog,
  MarketingEventStatusEnum,
  MarketingEventTransportEnum,
} from '../entities/marketing-event-log.entity';
import { MarketingPixelCryptoService } from './marketing-pixel-crypto.service';
import { resolvePixelFires } from '../utils/resolve-pixel-fires.util';
import { MetaCapiAdapter } from '../capi/meta-capi.adapter';
import { TiktokEventsAdapter } from '../capi/tiktok-events.adapter';
import { Ga4MeasurementAdapter } from '../capi/ga4-measurement.adapter';
import { GoogleAdsCapiAdapter } from '../capi/google-ads-capi.adapter';
import { CapiAdapter, CapiEvent } from '../capi/capi-adapter.interface';

const PROVIDER_SOURCE: Record<string, string> = {
  META: 'Meta Conversions API',
  GOOGLE_ANALYTICS: 'GA4 Measurement Protocol',
  GOOGLE_ADS: 'Google Ads API',
  TIKTOK: 'TikTok Events API',
};

/**
 * Sends one event to a pixel's provider server-side API and records the outcome
 * on `marketing_event_logs` (`transport = SERVER`). Never throws — a provider
 * failure is a logged `FAILED` row, not an exception that fails the caller.
 */
@Injectable()
export class DispatchServerEventService {
  private readonly logger = new Logger(DispatchServerEventService.name);
  private readonly adapters: Record<string, CapiAdapter>;

  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingPixelPageRule)
    private readonly ruleRepository: Repository<MarketingPixelPageRule>,
    @InjectRepository(MarketingEventLog)
    private readonly eventLogRepository: Repository<MarketingEventLog>,
    private readonly crypto: MarketingPixelCryptoService,
    meta: MetaCapiAdapter,
    tiktok: TiktokEventsAdapter,
    ga4: Ga4MeasurementAdapter,
    googleAds: GoogleAdsCapiAdapter,
  ) {
    this.adapters = {
      META: meta,
      TIKTOK: tiktok,
      GOOGLE_ANALYTICS: ga4,
      GOOGLE_ADS: googleAds,
    };
  }

  /**
   * @returns true when the event was accepted by the provider; false on skip
   *          (no adapter / no credentials) or provider failure.
   */
  async dispatch(pixel: MarketingPixel, event: CapiEvent): Promise<boolean> {
    if (!pixel.capiEnabled || !pixel.credentialsEncrypted) return false;

    const adapter = this.adapters[pixel.provider];
    if (!adapter) return false;

    const credentials = this.crypto.decrypt(pixel.credentialsEncrypted);
    if (!adapter.canDispatch(credentials)) {
      this.logger.debug(
        `Skipping ${pixel.provider} server dispatch for pixel ${pixel.id}: missing credentials.`,
      );
      return false;
    }

    const result = await adapter.dispatch(pixel.pixelId, credentials, event);

    await this.eventLogRepository.save(
      this.eventLogRepository.create({
        tenantId: pixel.tenantId,
        storeId: pixel.storeId,
        pixelId: pixel.id,
        provider: pixel.provider,
        eventName: event.eventName,
        transport: MarketingEventTransportEnum.SERVER,
        source: PROVIDER_SOURCE[pixel.provider] ?? pixel.provider,
        sessionId: event.sessionId ?? null,
        orderId: event.orderId ?? null,
        orderRef: event.orderRef ?? '-',
        status: result.ok ? MarketingEventStatusEnum.SENT : MarketingEventStatusEnum.FAILED,
        httpStatus: result.httpStatus,
        errorMessage: result.errorMessage ?? null,
        payloadJson: result.sentPayload,
        createdAt: new Date(),
      }),
    );

    if (result.ok) {
      pixel.lastEventAt = new Date();
      await this.pixelRepository.save(pixel);
    }

    return result.ok;
  }

  /**
   * Dispatch `event` through every capiEnabled pixel of a store whose page rules
   * allow the given storefront page (an `ALL`-scoped pixel always qualifies).
   */
  async dispatchForStore(
    tenantId: string,
    storeId: string,
    event: CapiEvent,
    page: { pathname: string; pageType: string },
  ): Promise<{ sent: number; failed: number; skipped: number }> {
    const pixels = await this.pixelRepository.find({
      where: { tenantId, storeId, capiEnabled: true },
    });
    if (pixels.length === 0) return { sent: 0, failed: 0, skipped: 0 };

    const rules = await this.ruleRepository.find({
      where: { pixelId: In(pixels.map((p) => p.id)) },
    });
    const rulesByPixel = new Map<string, MarketingPixelPageRule[]>();
    for (const r of rules) {
      const arr = rulesByPixel.get(r.pixelId) ?? [];
      arr.push(r);
      rulesByPixel.set(r.pixelId, arr);
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    for (const pixel of pixels) {
      const fires = resolvePixelFires(
        pixel.pageScopeMode as 'ALL' | 'RULES',
        (rulesByPixel.get(pixel.id) ?? []).map((r) => ({
          matchType: r.matchType,
          pageType: r.pageType,
          urlPattern: r.urlPattern,
          include: r.include,
        })),
        page,
      );
      if (!fires) {
        skipped += 1;
        continue;
      }
      const ok = await this.dispatch(pixel, event);
      if (ok) sent += 1;
      else failed += 1;
    }
    return { sent, failed, skipped };
  }
}
