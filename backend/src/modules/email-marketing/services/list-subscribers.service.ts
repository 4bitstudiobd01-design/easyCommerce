import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriberEntity } from '../entities/newsletter-subscriber.entity';

@Injectable()
export class ListSubscribersService {
  constructor(
    @InjectRepository(NewsletterSubscriberEntity)
    private readonly subscriberRepository: Repository<NewsletterSubscriberEntity>,
  ) {}

  async execute(storeId: string): Promise<NewsletterSubscriberEntity[]> {
    return await this.subscriberRepository.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }
}
