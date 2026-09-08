import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MarketingPixel } from '../entities/marketing-pixel.entity';
import { MarketingPixelPageRule } from '../entities/marketing-pixel-page-rule.entity';
import { MarketingPixelCryptoService } from './marketing-pixel-crypto.service';
import { serializePixel, SerializedPixel } from './pixel-serializer';

@Injectable()
export class ListPixelsService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingPixelPageRule)
    private readonly ruleRepository: Repository<MarketingPixelPageRule>,
    private readonly crypto: MarketingPixelCryptoService,
  ) {}

  async execute(tenantId: string, storeId: string): Promise<SerializedPixel[]> {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId are required');
    }

    const pixels = await this.pixelRepository.find({
      where: { tenantId, storeId },
      order: { provider: 'ASC', createdAt: 'ASC' },
    });
    if (pixels.length === 0) return [];

    const rules = await this.ruleRepository.find({
      where: { pixelId: In(pixels.map((p) => p.id)) },
      order: { createdAt: 'ASC' },
    });
    const rulesByPixel = new Map<string, MarketingPixelPageRule[]>();
    for (const r of rules) {
      const arr = rulesByPixel.get(r.pixelId) ?? [];
      arr.push(r);
      rulesByPixel.set(r.pixelId, arr);
    }

    return pixels.map((p) => serializePixel(p, this.crypto, rulesByPixel.get(p.id) ?? []));
  }
}
