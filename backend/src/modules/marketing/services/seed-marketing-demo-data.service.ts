import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import {
  MarketingPixel,
  MarketingPixelStatusEnum,
  MarketingProviderEnum,
} from '../entities/marketing-pixel.entity';
import {
  MarketingEventConfig,
  MarketingEventNameEnum,
} from '../entities/marketing-event-config.entity';
import {
  MarketingEventLog,
  MarketingEventStatusEnum,
} from '../entities/marketing-event-log.entity';

export interface SeedMarketingDemoResult {
  success: boolean;
  message: string;
  pixelsCreated: number;
  eventConfigsCreated: number;
  eventLogsCreated: number;
}

// Demo pixels use format-valid ids per provider so the dashboard renders them
// exactly as a real connection would.
const DEMO_PIXELS: { provider: MarketingProviderEnum; pixelId: string; source: string }[] = [
  { provider: MarketingProviderEnum.META, pixelId: '849204928123456', source: 'Meta Pixel' },
  { provider: MarketingProviderEnum.GOOGLE_ANALYTICS, pixelId: 'G-8492049281', source: 'Google Analytics' },
  { provider: MarketingProviderEnum.TIKTOK, pixelId: 'C1234567890ABCDEF', source: 'TikTok Pixel' },
];

const DEMO_EVENT_NAMES = Object.values(MarketingEventNameEnum);

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - n);
  return d;
}

/**
 * Seeds demo marketing pixels, per-event tracking configs and a handful of
 * recent event logs so the Marketing dashboard shows data immediately in dev.
 * Idempotent — if any pixel already exists for the store it does nothing.
 * Writes directly through the repositories (bypassing provider token checks)
 * because these are throwaway demo rows.
 */
@Injectable()
export class SeedMarketingDemoDataService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingEventConfig)
    private readonly eventConfigRepository: Repository<MarketingEventConfig>,
    @InjectRepository(MarketingEventLog)
    private readonly eventLogRepository: Repository<MarketingEventLog>,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  /**
   * Resolves the store from the caller's user id (and optional x-store-id) rather
   * than trusting header-supplied tenant/store ids — matching how the rest of the
   * merchant API derives store context.
   */
  async execute(userId: string, storeIdHeader?: string): Promise<SeedMarketingDemoResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'The marketing demo seeder is disabled in production environments.',
      );
    }

    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before seeding marketing data.');
    }
    const { tenantId, id: storeId } = store;

    const existing = await this.pixelRepository.count({ where: { tenantId, storeId } });
    if (existing > 0) {
      return {
        success: true,
        message: 'Marketing demo data already present — nothing seeded.',
        pixelsCreated: 0,
        eventConfigsCreated: 0,
        eventLogsCreated: 0,
      };
    }

    const pixels = await this.pixelRepository.save(
      DEMO_PIXELS.map((p) =>
        this.pixelRepository.create({
          tenantId,
          storeId,
          provider: p.provider,
          pixelId: p.pixelId,
          accessToken: 'demo-access-token-not-a-real-credential',
          status: MarketingPixelStatusEnum.CONNECTED,
          lastEventAt: hoursAgo(1),
        }),
      ),
    );

    const eventConfigs = await this.eventConfigRepository.save(
      DEMO_EVENT_NAMES.map((eventName) =>
        this.eventConfigRepository.create({
          tenantId,
          storeId,
          eventName,
          isActive: true,
        }),
      ),
    );

    // A rolling window of recent events across the connected sources, mostly
    // delivered with the occasional failure so the log view has both states.
    const logRows: Partial<MarketingEventLog>[] = [];
    for (let i = 0; i < 24; i++) {
      const pixel = DEMO_PIXELS[i % DEMO_PIXELS.length];
      const eventName = DEMO_EVENT_NAMES[i % DEMO_EVENT_NAMES.length];
      const failed = i % 9 === 0 && i !== 0;
      logRows.push({
        tenantId,
        storeId,
        eventName,
        source: pixel.source,
        orderRef: eventName === MarketingEventNameEnum.Purchase ? `ORD-DEMO-${1000 + i}` : undefined,
        status: failed ? MarketingEventStatusEnum.FAILED : MarketingEventStatusEnum.SENT,
        errorDetails: failed ? 'Demo: simulated delivery failure (HTTP 408 timeout).' : undefined,
        payloadJson: { demo: true, eventName, value: (i % 5) * 250 + 500, currency: 'BDT' },
        createdAt: hoursAgo(i * 2),
      });
    }
    const eventLogs = await this.eventLogRepository.save(
      logRows.map((r) => this.eventLogRepository.create(r)),
    );

    return {
      success: true,
      message: 'Marketing demo data seeded.',
      pixelsCreated: pixels.length,
      eventConfigsCreated: eventConfigs.length,
      eventLogsCreated: eventLogs.length,
    };
  }
}
