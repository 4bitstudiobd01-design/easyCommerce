import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingPixel } from '../entities/marketing-pixel.entity';
import { GetPixelService } from './get-pixel.service';

@Injectable()
export class DeletePixelService {
  constructor(
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
    private readonly getPixelService: GetPixelService,
  ) {}

  /**
   * Hard-deletes the pixel. Its `marketing_pixel_page_rules` cascade-delete (FK),
   * and `marketing_event_logs.pixelId` is set null (FK) so the event history is kept.
   */
  async execute(tenantId: string, storeId: string, id: string): Promise<{ message: string }> {
    const pixel = await this.getPixelService.loadOwned(tenantId, storeId, id);
    await this.pixelRepository.remove(pixel);
    return { message: 'Pixel deleted.' };
  }
}
