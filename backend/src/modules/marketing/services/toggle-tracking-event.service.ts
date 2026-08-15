import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingEventConfig, MarketingEventNameEnum } from '../entities/marketing-event-config.entity';

@Injectable()
export class ToggleTrackingEventService {
  constructor(
    @InjectRepository(MarketingEventConfig)
    private readonly eventConfigRepository: Repository<MarketingEventConfig>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    eventName: MarketingEventNameEnum,
    isActive: boolean,
  ) {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId headers are required');
    }

    let config = await this.eventConfigRepository.findOne({
      where: { tenantId, storeId, eventName },
    });

    if (config) {
      config.isActive = isActive;
      config.updatedAt = new Date();
    } else {
      config = this.eventConfigRepository.create({
        tenantId,
        storeId,
        eventName,
        isActive,
      });
    }

    const saved = await this.eventConfigRepository.save(config);
    return {
      message: `Event ${eventName} ${isActive ? 'enabled' : 'disabled'} successfully`,
      data: saved,
    };
  }
}
