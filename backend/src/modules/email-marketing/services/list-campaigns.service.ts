import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCampaignEntity } from '../entities/email-campaign.entity';

@Injectable()
export class ListCampaignsService {
  constructor(
    @InjectRepository(EmailCampaignEntity)
    private readonly campaignRepository: Repository<EmailCampaignEntity>,
  ) {}

  async execute(storeId: string): Promise<EmailCampaignEntity[]> {
    return await this.campaignRepository.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }
}
