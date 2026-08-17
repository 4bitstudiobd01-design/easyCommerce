import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConfigEntity } from '../entities/platform-config.entity';
import { UpdatePlatformConfigDto } from '../dto/update-platform-config.dto';

@Injectable()
export class PlatformConfigService {
  constructor(
    @InjectRepository(PlatformConfigEntity)
    private readonly platformConfigRepository: Repository<PlatformConfigEntity>,
  ) {}

  async getConfig(): Promise<PlatformConfigEntity> {
    let config = await this.platformConfigRepository.findOne({ where: { configKey: 'global' } });
    if (!config) {
      config = this.platformConfigRepository.create({
        configKey: 'global',
        heroContent: {
          title: 'Sell Anything Online Physical, Digital or Resell',
          subtitle: 'Whether you sell physical products, digital downloads, e-books, or supplier resell items — BitCommerce empowers any Bangladeshi merchant to launch and scale effortlessly.',
          ctaPrimaryText: 'Launch Your Store Now',
          ctaPrimaryLink: '/register',
          ctaSecondaryText: 'Sign In to Merchant Admin',
          ctaSecondaryLink: '/login',
        },
        pricingPlans: [],
        testimonials: [],
        faqs: [],
      });
      await this.platformConfigRepository.save(config);
    }
    return config;
  }

  async updateConfig(dto: UpdatePlatformConfigDto): Promise<PlatformConfigEntity> {
    const config = await this.getConfig();
    Object.assign(config, dto);
    return this.platformConfigRepository.save(config);
  }
}
