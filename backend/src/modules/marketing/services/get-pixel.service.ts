import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingPixel } from '../entities/marketing-pixel.entity';
import { MarketingPixelPageRule } from '../entities/marketing-pixel-page-rule.entity';
import { MarketingPixelCryptoService } from './marketing-pixel-crypto.service';
import { serializePixel, SerializedPixel } from './pixel-serializer';

@Injectable()
export class GetPixelService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingPixelPageRule)
    private readonly ruleRepository: Repository<MarketingPixelPageRule>,
    private readonly crypto: MarketingPixelCryptoService,
  ) {}

  /** Loads one pixel + its rules. 404 (never 403) for another tenant so existence isn't leaked. */
  async loadOwned(tenantId: string, storeId: string, id: string): Promise<MarketingPixel> {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId are required');
    }
    const pixel = await this.pixelRepository.findOne({ where: { id, tenantId, storeId } });
    if (!pixel) {
      throw new NotFoundException('Pixel not found.');
    }
    return pixel;
  }

  async execute(tenantId: string, storeId: string, id: string): Promise<SerializedPixel> {
    const pixel = await this.loadOwned(tenantId, storeId, id);
    const rules = await this.ruleRepository.find({
      where: { pixelId: pixel.id },
      order: { createdAt: 'ASC' },
    });
    return serializePixel(pixel, this.crypto, rules);
  }
}
