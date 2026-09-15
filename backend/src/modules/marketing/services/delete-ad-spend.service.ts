import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingAdSpend } from '../entities/marketing-ad-spend.entity';

@Injectable()
export class DeleteAdSpendService {
  constructor(
    @InjectRepository(MarketingAdSpend)
    private readonly adSpendRepository: Repository<MarketingAdSpend>,
  ) {}

  async execute(tenantId: string, storeId: string, id: string) {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId headers are required');
    }

    const entry = await this.adSpendRepository.findOne({
      where: { id, tenantId, storeId },
    });
    if (!entry) {
      throw new NotFoundException('Ad spend entry not found.');
    }

    await this.adSpendRepository.remove(entry);
    return { message: 'Ad spend entry deleted.' };
  }
}
