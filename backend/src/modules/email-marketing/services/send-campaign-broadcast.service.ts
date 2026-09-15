import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmailCampaignEntity,
  CampaignStatusEnum,
  CampaignRecipientTypeEnum,
} from '../entities/email-campaign.entity';
import { NewsletterSubscriberEntity } from '../entities/newsletter-subscriber.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { NotificationDispatcherService } from '../../sms/services/notification-dispatcher.service';

@Injectable()
export class SendCampaignBroadcastService {
  private readonly logger = new Logger(SendCampaignBroadcastService.name);

  constructor(
    @InjectRepository(EmailCampaignEntity)
    private readonly campaignRepository: Repository<EmailCampaignEntity>,
    @InjectRepository(NewsletterSubscriberEntity)
    private readonly subscriberRepository: Repository<NewsletterSubscriberEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly notificationDispatcherService: NotificationDispatcherService,
  ) {}

  async execute(
    storeId: string,
    campaignId: string,
  ): Promise<{ success: boolean; totalSent: number; campaign: EmailCampaignEntity }> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, storeId },
    });

    if (!campaign) {
      throw new NotFoundException('Email campaign not found.');
    }

    if (campaign.status === CampaignStatusEnum.SENDING) {
      throw new BadRequestException('Campaign is currently sending.');
    }

    campaign.status = CampaignStatusEnum.SENDING;
    await this.campaignRepository.save(campaign);

    const emailSet = new Set<string>();

    // 1. Collect Subscriber emails
    if (
      campaign.recipientType === CampaignRecipientTypeEnum.ALL_SUBSCRIBERS ||
      campaign.recipientType === CampaignRecipientTypeEnum.ALL_AUDIENCE
    ) {
      const subscribers = await this.subscriberRepository.find({
        where: { storeId, isSubscribed: true },
      });
      subscribers.forEach((s) => {
        if (s.email) emailSet.add(s.email.toLowerCase().trim());
      });
    }

    // 2. Collect Customer emails from orders
    if (
      campaign.recipientType === CampaignRecipientTypeEnum.ALL_CUSTOMERS ||
      campaign.recipientType === CampaignRecipientTypeEnum.ALL_AUDIENCE
    ) {
      const orders = await this.orderRepository.find({
        where: { tenantId: campaign.tenantId },
        select: ['customerEmail'],
      });
      orders.forEach((o) => {
        if (o.customerEmail) emailSet.add(o.customerEmail.toLowerCase().trim());
      });
    }

    const recipients = Array.from(emailSet);

    this.logger.log(
      `Starting broadcast for Campaign "${campaign.title}" to ${recipients.length} recipients...`,
    );

    let sentCount = 0;

    for (const recipientEmail of recipients) {
      try {
        await this.notificationDispatcherService.dispatch({
          tenantId: campaign.tenantId,
          recipientEmail,
          emailSubject: campaign.subject,
          emailBody: campaign.contentHtml,
        });
        sentCount++;
      } catch (err) {
        this.logger.error(`Failed to send email to ${recipientEmail}:`, err);
      }
    }

    campaign.status = CampaignStatusEnum.SENT;
    campaign.totalSent = sentCount;
    campaign.sentAt = new Date();

    const updated = await this.campaignRepository.save(campaign);

    return {
      success: true,
      totalSent: sentCount,
      campaign: updated,
    };
  }
}
