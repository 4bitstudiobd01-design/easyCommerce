import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { MarketingPixel, MarketingPixelStatusEnum } from '../entities/marketing-pixel.entity';
import { MarketingPixelPageRule } from '../entities/marketing-pixel-page-rule.entity';
import { MarketingPixelCryptoService } from './marketing-pixel-crypto.service';
import { GetPixelService } from './get-pixel.service';
import { serializePixel, SerializedPixel } from './pixel-serializer';
import { UpdatePixelDto } from '../dto/pixel.dto';

@Injectable()
export class UpdatePixelService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    @InjectRepository(MarketingPixelPageRule)
    private readonly ruleRepository: Repository<MarketingPixelPageRule>,
    private readonly crypto: MarketingPixelCryptoService,
    private readonly getPixelService: GetPixelService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    id: string,
    dto: UpdatePixelDto,
  ): Promise<{ message: string; data: SerializedPixel }> {
    const pixel = await this.getPixelService.loadOwned(tenantId, storeId, id);

    if (dto.label !== undefined) {
      const label = dto.label.trim();
      const clash = await this.pixelRepository.findOne({
        where: { storeId, provider: pixel.provider, label, id: Not(pixel.id) },
      });
      if (clash) {
        throw new ConflictException(
          `A ${pixel.provider} pixel named "${label}" already exists in this store.`,
        );
      }
      pixel.label = label;
    }

    if (dto.pixelId !== undefined) pixel.pixelId = dto.pixelId.trim();
    if (dto.capiEnabled !== undefined) pixel.capiEnabled = dto.capiEnabled;
    if (dto.pageScopeMode !== undefined) pixel.pageScopeMode = dto.pageScopeMode;
    if (dto.isActive !== undefined) pixel.isActive = dto.isActive;
    if (dto.status !== undefined) {
      pixel.status =
        dto.status === 'DISCONNECTED'
          ? MarketingPixelStatusEnum.DISCONNECTED
          : MarketingPixelStatusEnum.CONNECTED;
    }

    // credentials: undefined = leave as-is; null = clear all; object = merge over stored
    if (dto.credentials === null) {
      pixel.credentialsEncrypted = null;
    } else if (dto.credentials !== undefined) {
      const stored = this.crypto.decrypt(pixel.credentialsEncrypted);
      const merged = this.crypto.merge(stored, dto.credentials);
      pixel.credentialsEncrypted = this.crypto.encrypt(merged);
    }

    const saved = await this.pixelRepository.save(pixel);
    const rules = await this.ruleRepository.find({
      where: { pixelId: saved.id },
      order: { createdAt: 'ASC' },
    });
    return { message: 'Pixel updated.', data: serializePixel(saved, this.crypto, rules) };
  }
}
