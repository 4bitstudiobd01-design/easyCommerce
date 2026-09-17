import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MarketingPixel,
  MarketingPixelStatusEnum,
  PixelPageScopeModeEnum,
} from '../entities/marketing-pixel.entity';
import { MarketingPixelCryptoService } from './marketing-pixel-crypto.service';
import { serializePixel, SerializedPixel } from './pixel-serializer';
import { CreatePixelDto } from '../dto/pixel.dto';

@Injectable()
export class CreatePixelService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    private readonly crypto: MarketingPixelCryptoService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreatePixelDto,
  ): Promise<{ message: string; data: SerializedPixel }> {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId are required');
    }

    const label = dto.label.trim();
    const clash = await this.pixelRepository.findOne({
      where: { storeId, provider: dto.provider, label },
    });
    if (clash) {
      throw new ConflictException(
        `A ${dto.provider} pixel named "${label}" already exists in this store.`,
      );
    }

    const credentialsEncrypted = dto.credentials
      ? this.crypto.encrypt(this.crypto.merge({}, dto.credentials))
      : null;

    const pixel = this.pixelRepository.create({
      tenantId,
      storeId,
      provider: dto.provider,
      label,
      pixelId: dto.pixelId.trim(),
      credentialsEncrypted,
      capiEnabled: dto.capiEnabled ?? false,
      pageScopeMode: dto.pageScopeMode ?? PixelPageScopeModeEnum.ALL,
      isActive: dto.isActive ?? true,
      status: MarketingPixelStatusEnum.CONNECTED,
    });

    const saved = await this.pixelRepository.save(pixel);
    return { message: 'Pixel created.', data: serializePixel(saved, this.crypto, []) };
  }
}
