import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCampaignEntity, CampaignStatusEnum } from '../entities/email-campaign.entity';
import { CreateEmailCampaignDto } from '../dto/create-campaign.dto';

@Injectable()
export class CreateCampaignService {
  constructor(
    @InjectRepository(EmailCampaignEntity)
    private readonly campaignRepository: Repository<EmailCampaignEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateEmailCampaignDto,
  ): Promise<EmailCampaignEntity> {
    const campaign = this.campaignRepository.create({
      tenantId,
      storeId,
      title: dto.title,
      subject: dto.subject,
      contentHtml: dto.contentHtml,
      recipientType: dto.recipientType,
      status: CampaignStatusEnum.DRAFT,
      totalSent: 0,
    });

    return await this.campaignRepository.save(campaign);
  }
}
