import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { MarketingPixel, MarketingPixelStatusEnum, MarketingProviderEnum } from '../entities/marketing-pixel.entity';
import { MarketingEventConfig, MarketingEventNameEnum } from '../entities/marketing-event-config.entity';
import { MarketingEventLog, MarketingEventStatusEnum } from '../entities/marketing-event-log.entity';

@Injectable()
export class GetMarketingDashboardService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingEventConfig)
    private readonly eventConfigRepository: Repository<MarketingEventConfig>,
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

      // 1. Fetch real pixels from DB for this tenant & store
      const dbPixels = await this.pixelRepository.find({
        where: { tenantId, storeId },
      });

      // 2. Fetch real event configs from DB
      const dbConfigs = await this.eventConfigRepository.find({
        where: { tenantId, storeId },
      });

      // 3. Count real logs today
      const totalEventsToday = await this.eventLogRepository.count({
        where: {
          tenantId,
          storeId,
          createdAt: MoreThanOrEqual(todayStart),
        },
      });

      const failedEventsToday = await this.eventLogRepository.count({
        where: {
          tenantId,
          storeId,
          status: MarketingEventStatusEnum.FAILED,
          createdAt: MoreThanOrEqual(todayStart),
        },
      });

      const connectedPixels = dbPixels.filter((p) => p.status === MarketingPixelStatusEnum.CONNECTED);
      const connectedCount = connectedPixels.length;

      // Provider display metadata
      const providerMeta: Record<MarketingProviderEnum, { name: string; description: string }> = {
        [MarketingProviderEnum.META]: {
          name: 'Meta Pixel',
          description: 'Track Facebook & Instagram ad conversions with Conversions API',
        },
        [MarketingProviderEnum.GOOGLE_ANALYTICS]: {
          name: 'Google Analytics 4',
          description: 'Track website traffic and user behavior with Google Analytics 4.',
        },
        [MarketingProviderEnum.GOOGLE_ADS]: {
          name: 'Google Ads',
          description: 'Track conversions and optimize your Google Ads campaigns.',
        },
        [MarketingProviderEnum.TIKTOK]: {
          name: 'TikTok Pixel',
          description: 'Track TikTok ad conversions and build custom audiences.',
        },
      };

      // 4. Map real integrations
      const integrations = Object.values(MarketingProviderEnum).map((provider) => {
        const found = dbPixels.find((p) => p.provider === provider);
        const meta = providerMeta[provider];

        if (found && found.status === MarketingPixelStatusEnum.CONNECTED) {
          return {
            id: found.id,
            provider: found.provider,
            name: meta.name,
            status: 'CONNECTED' as const,
            pixelId: found.pixelId,
            eventsToday: totalEventsToday > 0 ? Math.floor(totalEventsToday / (connectedCount || 1)) : 0,
            lastEventAt: found.lastEventAt ? found.lastEventAt.toISOString() : undefined,
          };
        }

        return {
          id: `pixel_${provider.toLowerCase()}`,
          provider,
          name: meta.name,
          status: 'DISCONNECTED' as const,
          description: meta.description,
        };
      });

      // 5. Map standard events with real DB configs and logs
      const standardEvents = [
        { name: MarketingEventNameEnum.PageView, desc: 'Page or product viewed' },
        { name: MarketingEventNameEnum.ViewContent, desc: 'Product detail viewed' },
        { name: MarketingEventNameEnum.AddToCart, desc: 'Product added to cart' },
        { name: MarketingEventNameEnum.InitiateCheckout, desc: 'Checkout started' },
        { name: MarketingEventNameEnum.Purchase, desc: 'Order completed' },
      ];

      const trackingEvents = await Promise.all(
        standardEvents.map(async (evt, idx) => {
          const config = dbConfigs.find((c) => c.eventName === evt.name);
          const isActive = config ? config.isActive : true;

          const eventCountToday = await this.eventLogRepository.count({
            where: {
              tenantId,
              storeId,
              eventName: evt.name,
              createdAt: MoreThanOrEqual(todayStart),
            },
          });

          const lastLog = await this.eventLogRepository.findOne({
            where: { tenantId, storeId, eventName: evt.name },
            order: { createdAt: 'DESC' },
          });

          return {
            id: `evt_${idx + 1}`,
            eventName: evt.name,
            description: evt.desc,
            isActive,
            eventsToday: eventCountToday,
            lastTriggeredAt: lastLog ? lastLog.createdAt.toISOString() : undefined,
            successRate: 100,
          };
        }),
      );

      const successRate = totalEventsToday > 0
        ? Number((((totalEventsToday - failedEventsToday) / totalEventsToday) * 100).toFixed(1))
        : 100;

      return {
        kpis: {
          connectedPixels: {
            count: connectedCount,
            total: 4,
            changeText: connectedCount > 0 ? `+${connectedCount} active` : '0 connected',
            changeDirection: 'up' as const,
          },
          activePixels: {
            count: connectedCount,
            subtext: connectedCount > 0 ? `${connectedCount} transmitting` : 'None transmitting',
            changeText: connectedCount > 0 ? 'Live' : 'Inactive',
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
        integrations,
        trackingEvents,
      };
    } catch {
      return this.getEmptyDashboard();
    }
  }

  private getEmptyDashboard() {
    return {
      kpis: {
        connectedPixels: { count: 0, total: 4, changeText: '0 connected', changeDirection: 'up' as const },
        activePixels: { count: 0, subtext: 'None transmitting', changeText: 'Inactive', changeDirection: 'up' as const },
        eventsToday: { count: 0, subtext: 'Across all pixels', changeText: '0 events', changeDirection: 'up' as const },
        eventsFailed: { count: 0, subtext: 'Delivery errors', changeText: '0 errors', changeDirection: 'down' as const },
        successRate: { count: 100, subtext: 'last 24 hours', changeText: 'Healthy', changeDirection: 'up' as const },
      },
      integrations: [
        {
          id: 'pixel_meta',
          provider: 'META' as const,
          name: 'Meta Pixel',
          status: 'DISCONNECTED' as const,
          description: 'Track Facebook & Instagram ad conversions with Conversions API',
        },
        {
          id: 'pixel_google_analytics',
          provider: 'GOOGLE_ANALYTICS' as const,
          name: 'Google Analytics 4',
          status: 'DISCONNECTED' as const,
          description: 'Track website traffic and user behavior with Google Analytics 4.',
        },
        {
          id: 'pixel_google_ads',
          provider: 'GOOGLE_ADS' as const,
          name: 'Google Ads',
          status: 'DISCONNECTED' as const,
          description: 'Track conversions and optimize your Google Ads campaigns.',
        },
        {
          id: 'pixel_tiktok',
          provider: 'TIKTOK' as const,
          name: 'TikTok Pixel',
          status: 'DISCONNECTED' as const,
          description: 'Track TikTok ad conversions and build custom audiences.',
        },
      ],
      trackingEvents: [
        { id: 'e1', eventName: 'PageView', description: 'Page or product viewed', isActive: true, eventsToday: 0, successRate: 100 },
        { id: 'e2', eventName: 'ViewContent', description: 'Product detail viewed', isActive: true, eventsToday: 0, successRate: 100 },
        { id: 'e3', eventName: 'AddToCart', description: 'Product added to cart', isActive: true, eventsToday: 0, successRate: 100 },
        { id: 'e4', eventName: 'InitiateCheckout', description: 'Checkout started', isActive: true, eventsToday: 0, successRate: 100 },
        { id: 'e5', eventName: 'Purchase', description: 'Order completed', isActive: true, eventsToday: 0, successRate: 100 },
      ],
    };
  }
}
