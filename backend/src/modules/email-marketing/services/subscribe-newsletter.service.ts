import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriberEntity } from '../entities/newsletter-subscriber.entity';
import { SubscribeNewsletterDto } from '../dto/subscribe-newsletter.dto';
import { StoreEntity } from '../../tenant/entities/store.entity';

@Injectable()
export class SubscribeNewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriberEntity)
    private readonly subscriberRepository: Repository<NewsletterSubscriberEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(
    dto: SubscribeNewsletterDto,
  ): Promise<{ success: boolean; message: string; subscriber: NewsletterSubscriberEntity }> {
    const store = await this.storeRepository.findOne({
      where: { slug: dto.storeSlug, isActive: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    const emailClean = dto.email.toLowerCase().trim();

    let subscriber = await this.subscriberRepository.findOne({
      where: { storeId: store.id, email: emailClean },
    });

    if (subscriber) {
      subscriber.isSubscribed = true;
      subscriber.unsubscribedAt = undefined as any;
      if (dto.name) subscriber.name = dto.name;
    } else {
      subscriber = this.subscriberRepository.create({
        tenantId: store.tenantId,
        storeId: store.id,
        email: emailClean,
        name: dto.name,
        isSubscribed: true,
        source: dto.source || 'STOREFRONT_FOOTER',
        subscribedAt: new Date(),
      });
    }

    const saved = await this.subscriberRepository.save(subscriber);

    return {
      success: true,
      message: 'Thank you for subscribing to our newsletter!',
      subscriber: saved,
    };
  }
}
