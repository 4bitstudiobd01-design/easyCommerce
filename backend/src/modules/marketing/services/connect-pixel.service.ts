import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingPixel, MarketingPixelStatusEnum, MarketingProviderEnum } from '../entities/marketing-pixel.entity';
import { ConnectPixelDto } from '../dto/connect-pixel.dto';

@Injectable()
export class ConnectPixelService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
  ) {}

  /**
   * Validate provider-specific Pixel ID format and parameters
   */
  private validatePixelInput(provider: MarketingProviderEnum, pixelId: string, accessToken?: string) {
    const trimmedId = pixelId.trim();

    switch (provider) {
      case MarketingProviderEnum.META: {
        // Meta Pixel IDs are numeric, 10 to 18 digits
        if (!/^\d{10,18}$/.test(trimmedId)) {
          throw new BadRequestException(
            'Invalid Meta Pixel ID. Meta Pixel IDs must consist of 10 to 18 digits (e.g., 849204928123456).',
          );
        }
        if (accessToken && accessToken.trim().length < 20) {
          throw new BadRequestException(
            'Invalid Meta Conversions API Access Token. Access tokens must be at least 20 characters long.',
          );
        }
        break;
      }

      case MarketingProviderEnum.GOOGLE_ANALYTICS: {
        // GA4 Measurement IDs start with G- followed by alphanumeric characters
        if (!/^G-[A-Z0-9]{7,14}$/i.test(trimmedId)) {
          throw new BadRequestException(
            "Invalid Google Analytics 4 Measurement ID. Must start with 'G-' followed by letters and numbers (e.g., G-8492049281).",
          );
        }
        break;
      }

      case MarketingProviderEnum.GOOGLE_ADS: {
        // Google Ads Conversion IDs are numeric (e.g. 123456789) or start with AW- (e.g. AW-123456789)
        if (!/^(AW-)?\d{7,14}$/i.test(trimmedId)) {
          throw new BadRequestException(
            "Invalid Google Ads Conversion ID. Must be numeric or start with 'AW-' (e.g., AW-123456789 or 123456789).",
          );
        }
        break;
      }

      case MarketingProviderEnum.TIKTOK: {
        // TikTok Pixel codes are alphanumeric, 12 to 26 characters
        if (!/^[A-Za-z0-9_-]{12,28}$/.test(trimmedId)) {
          throw new BadRequestException(
            'Invalid TikTok Pixel ID. Must be a 12 to 28 character alphanumeric code (e.g., C1234567890ABCDEF).',
          );
        }
        break;
      }

      default:
        if (!trimmedId) {
          throw new BadRequestException('Pixel ID cannot be empty.');
        }
    }
  }

  async execute(tenantId: string, storeId: string, dto: ConnectPixelDto) {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId headers are required');
    }

    const cleanPixelId = dto.pixelId.trim();
    const cleanAccessToken = dto.accessToken?.trim();

    // 1. Strict format validation
    this.validatePixelInput(dto.provider, cleanPixelId, cleanAccessToken);

    let pixel = await this.pixelRepository.findOne({
      where: { tenantId, storeId, provider: dto.provider },
    });

    if (pixel) {
      pixel.pixelId = cleanPixelId;
      pixel.accessToken = cleanAccessToken || pixel.accessToken;
      pixel.status = MarketingPixelStatusEnum.CONNECTED;
      pixel.updatedAt = new Date();
    } else {
      pixel = this.pixelRepository.create({
        tenantId,
        storeId,
        provider: dto.provider,
        pixelId: cleanPixelId,
        accessToken: cleanAccessToken,
        status: MarketingPixelStatusEnum.CONNECTED,
      });
    }

    const saved = await this.pixelRepository.save(pixel);
    return {
      message: `${dto.provider} Pixel validated and connected successfully!`,
      data: saved,
    };
  }
}
