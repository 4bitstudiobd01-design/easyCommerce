import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushNotificationEntity } from '../entities/push-notification.entity';

@Injectable()
export class MarkPushNotificationReadService {
  constructor(
    @InjectRepository(PushNotificationEntity)
    private readonly pushNotificationRepository: Repository<PushNotificationEntity>,
  ) {}

  async execute(tenantId: string, id: string): Promise<void> {
    const result = await this.pushNotificationRepository.update({ id, tenantId }, { isRead: true });
    if (!result.affected) {
      throw new NotFoundException('Notification not found.');
    }
  }
}
