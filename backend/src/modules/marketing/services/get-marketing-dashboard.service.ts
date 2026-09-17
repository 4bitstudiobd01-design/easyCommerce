import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { MarketingPixel, MarketingPixelStatusEnum } from '../entities/marketing-pixel.entity';
import { MarketingEventLog, MarketingEventStatusEnum } from '../entities/marketing-event-log.entity';

@Injectable()
export class GetMarketingDashboardService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingEventLog)
    private readonly eventLogRepository: Repository<MarketingEventLog>,
  ) {}

  async execute(tenantId: string, storeId: string) {
    if (!tenantId || !storeId) {
      return this.getEmptyDashboard();
    }

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const pixels = await this.pixelRepository.find({ where: { tenantId, storeId } });

      // Multi-instance counts — one row per pixel, not per provider.
      const totalPixels = pixels.length;
      const connectedCount = pixels.filter(
        (p) => p.status === MarketingPixelStatusEnum.CONNECTED,
      ).length;
      const activeCount = pixels.filter(
        (p) => p.status === MarketingPixelStatusEnum.CONNECTED && p.isActive,
      ).length;

      const totalEventsToday = await this.eventLogRepository.count({
        where: { tenantId, storeId, createdAt: MoreThanOrEqual(todayStart) },
      });
      const failedEventsToday = await this.eventLogRepository.count({
        where: {
          tenantId,
          storeId,
          status: MarketingEventStatusEnum.FAILED,
          createdAt: MoreThanOrEqual(todayStart),
        },
      });

      const successRate =
        totalEventsToday > 0
          ? Number((((totalEventsToday - failedEventsToday) / totalEventsToday) * 100).toFixed(1))
          : 100;

      return {
        kpis: {
          connectedPixels: {
            count: connectedCount,
            total: totalPixels,
            changeText:
              totalPixels === 0
                ? 'No pixels yet'
                : `${connectedCount} of ${totalPixels} connected`,
            changeDirection: 'up' as const,
          },
          activePixels: {
            count: activeCount,
            subtext: activeCount > 0 ? `${activeCount} transmitting` : 'None transmitting',
            changeText: activeCount > 0 ? 'Live' : 'Inactive',
            changeDirection: 'up' as const,
          },
          eventsToday: {
            count: totalEventsToday,
            subtext: 'Across all pixels',
            changeText: totalEventsToday > 0 ? 'Live stream' : '0 events',
            changeDirection: 'up' as const,
          },
          eventsFailed: {
            count: failedEventsToday,
            subtext: 'Delivery errors',
            changeText: failedEventsToday > 0 ? 'Errors logged' : '0 errors',
            changeDirection: failedEventsToday > 0 ? ('up' as const) : ('down' as const),
          },
          successRate: {
            count: successRate,
            subtext: 'last 24 hours',
            changeText: 'Healthy',
            changeDirection: 'up' as const,
          },
        },
        // Legacy field — no longer rendered; kept so the response shape is stable.
        integrations: [],
      };
    } catch {
      return this.getEmptyDashboard();
    }
  }

  private getEmptyDashboard() {
    return {
      kpis: {
        connectedPixels: { count: 0, total: 0, changeText: 'No pixels yet', changeDirection: 'up' as const },
        activePixels: { count: 0, subtext: 'None transmitting', changeText: 'Inactive', changeDirection: 'up' as const },
        eventsToday: { count: 0, subtext: 'Across all pixels', changeText: '0 events', changeDirection: 'up' as const },
        eventsFailed: { count: 0, subtext: 'Delivery errors', changeText: '0 errors', changeDirection: 'down' as const },
        successRate: { count: 100, subtext: 'last 24 hours', changeText: 'Healthy', changeDirection: 'up' as const },
      },
      integrations: [],
    };
  }
}
