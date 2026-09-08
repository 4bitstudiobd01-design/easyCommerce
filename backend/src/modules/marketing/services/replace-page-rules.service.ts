import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  MarketingPixelPageRule,
  PixelRuleMatchTypeEnum,
} from '../entities/marketing-pixel-page-rule.entity';
import { GetPixelService } from './get-pixel.service';
import { GetPageRulesService, SerializedPageRule } from './get-page-rules.service';
import { assertValidUrlPattern } from '../utils/url-pattern.util';
import { ReplacePageRulesDto } from '../dto/page-rule.dto';

@Injectable()
export class ReplacePageRulesService {
  constructor(
    @InjectRepository(MarketingPixelPageRule)
    private readonly ruleRepository: Repository<MarketingPixelPageRule>,
    private readonly dataSource: DataSource,
    private readonly getPixelService: GetPixelService,
    private readonly getPageRulesService: GetPageRulesService,
  ) {}

  /** Atomically swaps the pixel's entire rule set for the supplied one. */
  async execute(
    tenantId: string,
    storeId: string,
    pixelId: string,
    dto: ReplacePageRulesDto,
  ): Promise<{ message: string; data: SerializedPageRule[] }> {
    const pixel = await this.getPixelService.loadOwned(tenantId, storeId, pixelId);

    const prepared = dto.rules.map((r, i) => {
      const include = r.include ?? true;
      if (r.matchType === PixelRuleMatchTypeEnum.PAGE_TYPE) {
        if (!r.pageType) {
          throw new BadRequestException(`Rule ${i + 1}: pageType is required for a PAGE_TYPE rule.`);
        }
        return {
          tenantId,
          storeId,
          pixelId: pixel.id,
          matchType: PixelRuleMatchTypeEnum.PAGE_TYPE,
          pageType: r.pageType,
          urlPattern: null,
          include,
        };
      }
      // URL_PATTERN
      if (!r.urlPattern || r.urlPattern.trim().length === 0) {
        throw new BadRequestException(
          `Rule ${i + 1}: urlPattern is required for a URL_PATTERN rule.`,
        );
      }
      try {
        assertValidUrlPattern(r.urlPattern);
      } catch (e) {
        throw new BadRequestException(`Rule ${i + 1}: ${(e as Error).message}`);
      }
      return {
        tenantId,
        storeId,
        pixelId: pixel.id,
        matchType: PixelRuleMatchTypeEnum.URL_PATTERN,
        pageType: null,
        urlPattern: r.urlPattern.trim(),
        include,
      };
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(MarketingPixelPageRule, { pixelId: pixel.id });
      if (prepared.length > 0) {
        await manager.insert(MarketingPixelPageRule, prepared);
      }
    });

    const data = await this.getPageRulesService.execute(tenantId, storeId, pixel.id);
    return { message: `Saved ${data.length} page rule(s).`, data };
  }
}
