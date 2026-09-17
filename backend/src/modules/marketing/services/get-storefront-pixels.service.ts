import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MarketingPixel, MarketingPixelStatusEnum } from '../entities/marketing-pixel.entity';
import { MarketingPixelPageRule } from '../entities/marketing-pixel-page-rule.entity';
import { MarketingEventConfig } from '../entities/marketing-event-config.entity';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';

export interface StorefrontPixel {
  id: string;
  provider: string;
  pixelId: string;
  pageScopeMode: string;
  pageRules: {
    matchType: string;
    pageType: string | null;
    urlPattern: string | null;
    include: boolean;
  }[];
}

export interface StorefrontPixelsResponse {
  pixels: StorefrontPixel[];
  /** Store-wide master switch per standard event; missing = on. */
  eventConfig: Record<string, boolean>;
}

/**
 * PUBLIC, unauthenticated. Returns the connected + active pixels for a store —
 * pixel ids and page rules only, **never any credential material**. Consumed by
 * the storefront PixelLoader to decide which scripts to inject and which events
 * to fire per page. `tenantId` is resolved server-side from the slug.
 */
@Injectable()
export class GetStorefrontPixelsService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingPixelPageRule)
    private readonly ruleRepository: Repository<MarketingPixelPageRule>,
    @InjectRepository(MarketingEventConfig)
    private readonly eventConfigRepository: Repository<MarketingEventConfig>,
    private readonly findStoreBySlugService: FindStoreBySlugService,
  ) {}

  async execute(slug: string): Promise<StorefrontPixelsResponse> {
    const store = await this.findStoreBySlugService.execute(slug);

    const pixels = await this.pixelRepository.find({
      where: {
        tenantId: store.tenantId,
        storeId: store.id,
        status: MarketingPixelStatusEnum.CONNECTED,
        isActive: true,
      },
      order: { provider: 'ASC', createdAt: 'ASC' },
    });

    let rulesByPixel = new Map<string, MarketingPixelPageRule[]>();
    if (pixels.length > 0) {
      const rules = await this.ruleRepository.find({
        where: { pixelId: In(pixels.map((p) => p.id)) },
        order: { createdAt: 'ASC' },
      });
      rulesByPixel = rules.reduce((map, r) => {
        const arr = map.get(r.pixelId) ?? [];
        arr.push(r);
        map.set(r.pixelId, arr);
        return map;
      }, new Map<string, MarketingPixelPageRule[]>());
    }

    const configs = await this.eventConfigRepository.find({
      where: { tenantId: store.tenantId, storeId: store.id },
    });
    const eventConfig: Record<string, boolean> = {};
    for (const c of configs) eventConfig[c.eventName] = c.isActive;

    return {
      pixels: pixels.map((p) => ({
        id: p.id,
        provider: p.provider,
        pixelId: p.pixelId,
        pageScopeMode: p.pageScopeMode,
        pageRules: (rulesByPixel.get(p.id) ?? []).map((r) => ({
          matchType: r.matchType,
          pageType: r.pageType,
          urlPattern: r.urlPattern,
          include: r.include,
        })),
      })),
      eventConfig,
    };
  }
}
