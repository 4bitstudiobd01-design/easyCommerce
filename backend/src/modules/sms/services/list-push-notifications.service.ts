import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushNotificationEntity } from '../entities/push-notification.entity';

@Injectable()
export class ListPushNotificationsService {
  constructor(
    @InjectRepository(PushNotificationEntity)
    private readonly pushNotificationRepository: Repository<PushNotificationEntity>,
  ) {}

  async execute(tenantId: string): Promise<PushNotificationEntity[]> {
    return this.pushNotificationRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
