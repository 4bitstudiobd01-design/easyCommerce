import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingPixel, MarketingPixelStatusEnum } from '../entities/marketing-pixel.entity';
import {
  MarketingEventLog,
  MarketingEventStatusEnum,
  MarketingEventTransportEnum,
} from '../entities/marketing-event-log.entity';
import { GetPixelService } from './get-pixel.service';
import { DispatchServerEventService } from './dispatch-server-event.service';
import { TestPixelEventDto } from '../dto/pixel.dto';

const PROVIDER_SOURCE: Record<string, string> = {
  META: 'Meta Pixel',
  GOOGLE_ANALYTICS: 'Google Analytics 4',
  GOOGLE_ADS: 'Google Ads',
  TIKTOK: 'TikTok Pixel',
};

@Injectable()
export class TestPixelEventService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingEventLog)
    private readonly eventLogRepository: Repository<MarketingEventLog>,
    private readonly getPixelService: GetPixelService,
    private readonly dispatchServerEventService: DispatchServerEventService,
  ) {}

  /** Fire one simulated event through a specific pixel and log it. */
  async execute(tenantId: string, storeId: string, id: string, dto: TestPixelEventDto) {
    const pixel = await this.getPixelService.loadOwned(tenantId, storeId, id);
    const logs = await this.writeTestLogs(pixel, dto.eventName, dto.orderRef, dto.customPayload);
    return {
      message: `Test '${dto.eventName}' fired through "${pixel.label ?? pixel.provider}".`,
      data: {
        logs: logs.map((l) => ({
          id: l.id,
          eventName: l.eventName,
          transport: l.transport,
          source: l.source,
          status: l.status,
          createdAt: l.createdAt,
        })),
      },
    };
  }

  /** Fire a PageView through every connected + active pixel in the store. */
  async testAll(tenantId: string, storeId: string) {
    const pixels = await this.pixelRepository.find({
      where: { tenantId, storeId, status: MarketingPixelStatusEnum.CONNECTED, isActive: true },
    });
    const results: { pixelId: string; label: string | null; ok: boolean }[] = [];
    for (const pixel of pixels) {
      try {
        await this.writeTestLogs(pixel, 'PageView');
        results.push({ pixelId: pixel.id, label: pixel.label, ok: true });
      } catch {
        results.push({ pixelId: pixel.id, label: pixel.label, ok: false });
      }
    }
    return {
      message: `Tested ${results.filter((r) => r.ok).length}/${pixels.length} connected pixel(s).`,
      data: { results },
    };
  }

  private async writeTestLogs(
    pixel: MarketingPixel,
    eventName: string,
    orderRef?: string,
    customPayload?: Record<string, unknown>,
  ): Promise<MarketingEventLog[]> {
    const now = new Date();
    const source = PROVIDER_SOURCE[pixel.provider] ?? pixel.provider;
    const payload =
      customPayload ?? {
        event: eventName,
        event_time: Math.floor(now.getTime() / 1000),
        test: true,
        order_ref: orderRef ?? (eventName === 'Purchase' ? '#ORD-TEST' : undefined),
      };

    // Browser leg — always logged.
    const browserRow = await this.eventLogRepository.save(
      this.eventLogRepository.create({
        tenantId: pixel.tenantId,
        storeId: pixel.storeId,
        pixelId: pixel.id,
        provider: pixel.provider,
        eventName,
        transport: MarketingEventTransportEnum.BROWSER,
        source,
        orderRef: orderRef ?? (eventName === 'Purchase' ? '#ORD-TEST' : '-'),
        status: MarketingEventStatusEnum.SENT,
        payloadJson: payload,
        createdAt: now,
      }),
    );

    pixel.lastEventAt = now;
    await this.pixelRepository.save(pixel);

    // Server leg — real provider dispatch when CAPI is on + credentials exist.
    // dispatch() writes its own SERVER MarketingEventLog row (SENT or FAILED).
    if (pixel.capiEnabled && pixel.credentialsEncrypted) {
      await this.dispatchServerEventService
        .dispatch(pixel, {
          eventName,
          eventTime: now,
          orderRef: orderRef ?? (eventName === 'Purchase' ? '#ORD-TEST' : undefined),
        })
        .catch(() => undefined);
    }

    // Return just the browser row's summary; SERVER rows show up in the event log.
    return [browserRow];
  }
}
