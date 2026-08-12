import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity, SmsDriverEnum, EmailDriverEnum } from '../../tenant/entities/store.entity';
import { PushNotificationEntity, NotificationTypeEnum } from '../entities/push-notification.entity';
import { BulkSmsBdDriver } from '../drivers/bulksmsbd.driver';
import { GreenwebSmsDriver } from '../drivers/greenweb.driver';
import { SmtpEmailDriver } from '../drivers/smtp-email.driver';
import { WebPushDriver } from '../drivers/webpush.driver';
import { SendSmsService } from './send-sms.service';

export interface DispatchNotificationPayload {
  tenantId: string;
  recipientPhone?: string;
  recipientEmail?: string;
  smsMessage?: string;
  emailSubject?: string;
  emailBody?: string;
  pushTitle?: string;
  pushMessage?: string;
  notificationType?: NotificationTypeEnum;
}

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(PushNotificationEntity)
    private readonly pushNotificationRepository: Repository<PushNotificationEntity>,
    private readonly bulkSmsBdDriver: BulkSmsBdDriver,
    private readonly greenwebSmsDriver: GreenwebSmsDriver,
    private readonly smtpEmailDriver: SmtpEmailDriver,
    private readonly webPushDriver: WebPushDriver,
    private readonly sendSmsService: SendSmsService,
  ) {}

  async dispatch(payload: DispatchNotificationPayload): Promise<void> {
    const store = await this.storeRepository.findOne({ where: { tenantId: payload.tenantId } });

    // 1. Dispatch SMS using active SMS Driver
    if (payload.recipientPhone && payload.smsMessage) {
      const activeSmsDriver = store?.smsDriver || SmsDriverEnum.BULKSMSBD;

      if (activeSmsDriver !== SmsDriverEnum.DISABLED) {
        const driverResult =
          activeSmsDriver === SmsDriverEnum.GREENWEB
            ? await this.greenwebSmsDriver.sendSms({
                phone: payload.recipientPhone,
                message: payload.smsMessage,
                apiKey: store?.smsApiKey,
                senderId: store?.smsSenderId,
              })
            : await this.bulkSmsBdDriver.sendSms({
                phone: payload.recipientPhone,
                message: payload.smsMessage,
                apiKey: store?.smsApiKey,
                senderId: store?.smsSenderId,
              });

        await this.sendSmsService.execute({
          recipientPhone: payload.recipientPhone,
          message: payload.smsMessage,
          tenantId: payload.tenantId,
          gateway: driverResult.gatewayResponse?.gateway || activeSmsDriver,
          wasSent: driverResult.success,
        });
      }
    }

    // 2. Dispatch Email using active Email Driver
    if (payload.recipientEmail && payload.emailSubject && payload.emailBody) {
      const activeEmailDriver = store?.emailDriver || EmailDriverEnum.SMTP;

      if (activeEmailDriver !== EmailDriverEnum.DISABLED) {
        await this.smtpEmailDriver.sendEmail({
          toEmail: payload.recipientEmail,
          subject: payload.emailSubject,
          htmlBody: payload.emailBody,
          smtpHost: store?.smtpHost,
          smtpPort: store?.smtpPort,
          smtpUser: store?.smtpUser,
          smtpPass: store?.smtpPass,
          fromEmail: store?.fromEmail,
        });
      }
    }

    // 3. Dispatch In-App Web Push Notification to Merchant Dashboard
    const pushTitle = payload.pushTitle || payload.emailSubject || 'New Order Notification';
    const pushMessage = payload.pushMessage || payload.smsMessage || 'A new order has been received on your storefront!';

    const pushNotification = this.pushNotificationRepository.create({
      title: pushTitle,
      message: pushMessage,
      type: payload.notificationType || NotificationTypeEnum.ORDER_PLACED,
      isRead: false,
      tenantId: payload.tenantId,
    });

    await this.pushNotificationRepository.save(pushNotification);
    await this.webPushDriver.sendPushNotification({
      tenantId: payload.tenantId,
      title: pushTitle,
      message: pushMessage,
    });
  }
}
