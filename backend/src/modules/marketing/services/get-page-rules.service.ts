import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingPixelPageRule } from '../entities/marketing-pixel-page-rule.entity';
import { GetPixelService } from './get-pixel.service';

export interface SerializedPageRule {
  id: string;
  matchType: string;
  pageType: string | null;
  urlPattern: string | null;
  include: boolean;
}

@Injectable()
export class GetPageRulesService {
  constructor(
    @InjectRepository(MarketingPixelPageRule)
    private readonly ruleRepository: Repository<MarketingPixelPageRule>,
    private readonly getPixelService: GetPixelService,
  ) {}

  async execute(tenantId: string, storeId: string, pixelId: string): Promise<SerializedPageRule[]> {
    // Ownership check: 404s for another tenant's pixel before any rule is read.
    await this.getPixelService.loadOwned(tenantId, storeId, pixelId);

    const rules = await this.ruleRepository.find({
      where: { pixelId },
      order: { createdAt: 'ASC' },
    });
    return rules.map((r) => ({
      id: r.id,
      matchType: r.matchType,
      pageType: r.pageType,
      urlPattern: r.urlPattern,
      include: r.include,
    }));
  }
}
