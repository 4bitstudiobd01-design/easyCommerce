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
import { NotificationProducer } from '../../../common/notification/notification.producer';
import {
  orderPlacedEmailTemplate,
  OrderPlacedTemplateParams,
} from '../../../common/notification/templates/order-placed.template';
import {
  orderStatusEmailTemplate,
  OrderStatusTemplateParams,
} from '../../../common/notification/templates/order-status.template';
import {
  otpEmailTemplate,
  OtpTemplateParams,
} from '../../../common/notification/templates/otp.template';

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
  /** Optional: use a built-in HTML template instead of plain emailBody */
  template?: {
    type: 'ORDER_PLACED' | 'ORDER_STATUS' | 'OTP';
    params: OrderPlacedTemplateParams | OrderStatusTemplateParams | OtpTemplateParams;
  };
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
    // System-level async notification queue (Mailpit locally, SMTP in production)
    private readonly notificationProducer: NotificationProducer,
  ) {}

  async dispatch(payload: DispatchNotificationPayload): Promise<void> {
    const store = await this.storeRepository.findOne({ where: { tenantId: payload.tenantId } });

    // ── 1. SMS via store-specific driver ─────────────────────────────────────
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

    // ── 2. Email via system-level async queue (Mailpit / SMTP) ───────────────
    if (payload.recipientEmail && payload.emailSubject) {
      const activeEmailDriver = store?.emailDriver || EmailDriverEnum.SMTP;

      if (activeEmailDriver !== EmailDriverEnum.DISABLED) {
        // Resolve HTML body: use template if provided, else store-level SMTP, else queue
        let htmlBody: string | undefined;

        if (payload.template) {
          htmlBody = this.resolveTemplate(payload.template);
        }

        if (htmlBody || payload.emailBody) {
          // Use system-level async queue (Mailpit locally, real SMTP in prod)
          await this.notificationProducer.sendNotification(
            payload.recipientEmail,
            payload.emailSubject,
            payload.emailBody || 'Please view this email in an HTML-compatible client.',
            {
              email: true,
              sms: false,
              htmlBody,
              tenantId: payload.tenantId,
              type: payload.notificationType,
            },
          );

          this.logger.log(
            `[DISPATCHER] Email queued → ${payload.recipientEmail} | subject: "${payload.emailSubject}"`,
          );
        }
      }
    }

    // ── 3. In-app Web Push Notification ─────────────────────────────────────
    const pushTitle = payload.pushTitle || payload.emailSubject || 'New Notification';
    const pushMessage = payload.pushMessage || payload.smsMessage || 'You have a new notification.';

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

  private resolveTemplate(template: DispatchNotificationPayload['template']): string {
    if (!template) return '';

    switch (template.type) {
      case 'ORDER_PLACED':
        return orderPlacedEmailTemplate(template.params as OrderPlacedTemplateParams);
      case 'ORDER_STATUS':
        return orderStatusEmailTemplate(template.params as OrderStatusTemplateParams);
      case 'OTP':
        return otpEmailTemplate(template.params as OtpTemplateParams);
      default:
        return '';
    }
  }
}
