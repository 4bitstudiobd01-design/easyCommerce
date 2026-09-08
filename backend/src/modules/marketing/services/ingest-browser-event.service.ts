import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingPixel } from '../entities/marketing-pixel.entity';
import {
  MarketingEventLog,
  MarketingEventStatusEnum,
  MarketingEventTransportEnum,
} from '../entities/marketing-event-log.entity';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { DispatchServerEventService } from './dispatch-server-event.service';
import { IngestEventDto } from '../dto/ingest-event.dto';

const PROVIDER_SOURCE: Record<string, string> = {
  META: 'Meta Pixel',
  GOOGLE_ANALYTICS: 'Google Analytics 4',
  GOOGLE_ADS: 'Google Ads',
  TIKTOK: 'TikTok Pixel',
};

/**
 * PUBLIC, unauthenticated browser-event beacon (fires alongside `POST /tracking/visit`).
 * Records a `MarketingEventLog` row with `transport = BROWSER`. `tenantId` is resolved
 * server-side from the slug; the `pixelId` is validated against that store so a client
 * can't log events onto someone else's pixel. When the pixel is `capiEnabled`, the
 * server-side mirror is (Phase 4) enqueued here — for now it's a no-op.
 *
 * Best-effort: a bad beacon must never 500 the storefront, so failures are swallowed
 * and logged, and the endpoint always returns `{ recorded }`.
 */
@Injectable()
export class IngestBrowserEventService {
  private readonly logger = new Logger(IngestBrowserEventService.name);

  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingEventLog)
    private readonly eventLogRepository: Repository<MarketingEventLog>,
    private readonly findStoreBySlugService: FindStoreBySlugService,
    private readonly dispatchServerEventService: DispatchServerEventService,
  ) {}

  async execute(dto: IngestEventDto): Promise<{ recorded: boolean }> {
    try {
      const store = await this.findStoreBySlugService.execute(dto.storeSlug);

      const pixel = await this.pixelRepository.findOne({
        where: { id: dto.pixelId, tenantId: store.tenantId, storeId: store.id },
      });
      if (!pixel) {
        // Unknown or cross-store pixel id — silently ignore.
        return { recorded: false };
      }

      const now = new Date();
      await this.eventLogRepository.save(
        this.eventLogRepository.create({
          tenantId: store.tenantId,
          storeId: store.id,
          pixelId: pixel.id,
          provider: pixel.provider,
          eventName: dto.eventName,
          transport: MarketingEventTransportEnum.BROWSER,
          source: PROVIDER_SOURCE[pixel.provider] ?? pixel.provider,
          sessionId: dto.sessionId ?? null,
          orderRef: dto.orderRef ?? '-',
          utmSource: dto.utmSource ?? null,
          status: MarketingEventStatusEnum.SENT,
          payloadJson: {
            ...(dto.payload ?? {}),
            page_path: dto.pagePath,
          },
          createdAt: now,
        }),
      );

      pixel.lastEventAt = now;
      await this.pixelRepository.save(pixel);

      // Server-side mirror: fire the same event through the provider's API when the
      // pixel is capiEnabled + has credentials. Awaited but best-effort — its own
      // failures land as a FAILED SERVER log row, never an exception here.
      if (pixel.capiEnabled && pixel.credentialsEncrypted) {
        await this.dispatchServerEventService
          .dispatch(pixel, {
            eventName: dto.eventName,
            eventTime: now,
            sourceUrl: dto.pagePath ?? undefined,
            sessionId: dto.sessionId,
            orderRef: dto.orderRef,
            user: { userAgent: undefined },
          })
          .catch(() => undefined);
      }

      return { recorded: true };
    } catch (err) {
      this.logger.warn(`Browser event ingest failed: ${(err as Error).message}`);
      return { recorded: false };
    }
  }
}
