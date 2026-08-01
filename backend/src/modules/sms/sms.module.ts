import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmsLogEntity } from './entities/sms-log.entity';
import { PushNotificationEntity } from './entities/push-notification.entity';
import { StoreEntity } from '../tenant/entities/store.entity';
import { SendSmsService } from './services/send-sms.service';
import { TriggerOrderStatusSmsService } from './services/trigger-order-status-sms.service';
import { ListSmsLogsService } from './services/list-sms-logs.service';
import { ListPushNotificationsService } from './services/list-push-notifications.service';
import { MarkPushNotificationsReadService } from './services/mark-push-notifications-read.service';
import { NotificationDispatcherService } from './services/notification-dispatcher.service';
import { BulkSmsBdDriver } from './drivers/bulksmsbd.driver';
import { GreenwebSmsDriver } from './drivers/greenweb.driver';
import { SmtpEmailDriver } from './drivers/smtp-email.driver';
import { WebPushDriver } from './drivers/webpush.driver';
import { SmsController } from './sms.controller';
import { TenantModule } from '../tenant/tenant.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsLogEntity, PushNotificationEntity, StoreEntity]),
    TenantModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [SmsController],
  providers: [
    SendSmsService,
    TriggerOrderStatusSmsService,
    ListSmsLogsService,
    ListPushNotificationsService,
    MarkPushNotificationsReadService,
    NotificationDispatcherService,
    BulkSmsBdDriver,
    GreenwebSmsDriver,
    SmtpEmailDriver,
    WebPushDriver,
    JwtAuthGuard,
  ],
  exports: [
    SendSmsService,
    TriggerOrderStatusSmsService,
    ListSmsLogsService,
    ListPushNotificationsService,
    MarkPushNotificationsReadService,
    NotificationDispatcherService,
    BulkSmsBdDriver,
    GreenwebSmsDriver,
    SmtpEmailDriver,
    WebPushDriver,
    TypeOrmModule,
  ],
})
export class SmsModule {}
