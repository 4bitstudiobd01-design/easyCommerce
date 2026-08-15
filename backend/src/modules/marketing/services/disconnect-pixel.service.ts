import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingPixel, MarketingPixelStatusEnum, MarketingProviderEnum } from '../entities/marketing-pixel.entity';

@Injectable()
export class DisconnectPixelService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
  ) {}

  async execute(tenantId: string, storeId: string, provider: MarketingProviderEnum) {
    const pixel = await this.pixelRepository.findOne({
      where: { tenantId, storeId, provider },
    });

    if (!pixel) {
      throw new NotFoundException(`Pixel ${provider} is not connected.`);
    }

    pixel.status = MarketingPixelStatusEnum.DISCONNECTED;
    pixel.updatedAt = new Date();
    await this.pixelRepository.save(pixel);

    return {
      message: `${provider} Pixel disconnected successfully`,
    };
  }
}
