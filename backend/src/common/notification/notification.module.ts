import {
  Global,
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATION_DRIVER, NotificationChannel } from './notification.interface';
import { MailpitEmailDriver } from './drivers/mailpit-email.driver';
import { SmtpSystemEmailDriver } from './drivers/smtp-system-email.driver';
import { SmsSystemDriver } from './drivers/sms-system.driver';
import { NotificationProducer } from './notification.producer';
import { NotificationProcessor } from './notification.processor';

/**
 * Driver registry keyed by MAIL_DRIVER env value.
 * - `mailpit`  → MailpitEmailDriver (local dev — captures mail at http://localhost:8025)
 * - `smtp`     → SmtpSystemEmailDriver (production SMTP)
 * - `sms`      → SmsSystemDriver (BulkSmsBD)
 */
const EMAIL_DRIVER_REGISTRY: Record<string, any> = {
  mailpit: MailpitEmailDriver,
  smtp: SmtpSystemEmailDriver,
};

const SMS_DRIVER_REGISTRY: Record<string, any> = {
  sms: SmsSystemDriver,
};

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: 'notification' }),
    BullBoardModule.forFeature({
      name: 'notification',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [
    {
      provide: NOTIFICATION_DRIVER,
      useFactory: (): any => {
        const notificationDriver =
          process.env.NOTIFICATION_DRIVER || NotificationChannel.EMAIL;
        const mailDriver = process.env.MAIL_DRIVER || 'mailpit';

        // SMS channel selected
        if (notificationDriver === NotificationChannel.SMS) {
          const DriverClass = SMS_DRIVER_REGISTRY[notificationDriver];
          if (!DriverClass) {
            throw new Error(
              `Unknown SMS notification driver "${notificationDriver}". Available: ${Object.keys(SMS_DRIVER_REGISTRY).join(', ')}`,
            );
          }
          return new DriverClass();
        }

        // Email channel (default)
        const DriverClass = EMAIL_DRIVER_REGISTRY[mailDriver];
        if (!DriverClass) {
          throw new Error(
            `Unknown mail driver "${mailDriver}". Available: ${Object.keys(EMAIL_DRIVER_REGISTRY).join(', ')}`,
          );
        }

        const logger = new Logger('NotificationModule');
        logger.log(
          `[DRIVER] NotificationModule using driver: "${mailDriver}" (${DriverClass.name})`,
        );

        return new DriverClass();
      },
    },
    NotificationProducer,
    NotificationProcessor,
  ],
  exports: [NOTIFICATION_DRIVER, NotificationProducer],
})
export class NotificationModule implements OnModuleInit {
  private readonly logger = new Logger(NotificationModule.name);

  constructor(
    @InjectQueue('notification') private readonly notificationQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const cleanPromise = Promise.all([
        this.notificationQueue.clean(0, 500, 'completed'),
        this.notificationQueue.clean(0, 500, 'failed'),
      ]);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout (2s)')), 2000),
      );
      await Promise.race([cleanPromise, timeoutPromise]);
      this.logger.log('Notification queue cleaned on startup');
    } catch (err: any) {
      this.logger.warn(`Queue cleanup on startup skipped: ${err?.message}`);
    }
  }
}
