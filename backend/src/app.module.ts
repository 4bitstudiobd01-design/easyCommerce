import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { typeOrmConfig } from './config/database.config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { AdminModule } from './modules/admin/admin.module';
import { SmsModule } from './modules/sms/sms.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { StaffModule } from './modules/staff/staff.module';
import { EmailMarketingModule } from './modules/email-marketing/email-marketing.module';
import { SeoModule } from './modules/seo/seo.module';
import { BillingModule } from './modules/billing/billing.module';
import { CustomerModule } from './modules/customer/customer.module';
import { CustomerAuthModule } from './modules/customer/auth/customer-auth.module';
import { CustomerAccountModule } from './modules/customer/account/customer-account.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { BlogModule } from './modules/blog/blog.module';
import { FileModule } from './modules/file/file.module';
import { HrmModule } from './modules/hrm/hrm.module';
import { NotificationModule } from './common/notification/notification.module';
import { OmnichannelModule } from './modules/omnichannel/omnichannel.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // BullMQ — async job queue backed by Redis
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          // Local dev without Redis running: fail fast instead of retrying forever,
          // so boot doesn't hang. Queue-backed features (email/SMS) just won't fire.
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          enableReadyCheck: false,
          retryStrategy: () => null,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      }),
    }),
    // Bull Board — queue admin UI at /admin/queues
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    // System-level notification (email/SMS via queue)
    NotificationModule,
    UserModule,
    AuthModule,
    TenantModule,
    CatalogModule,
    InventoryModule,
    OrderModule,
    PaymentModule,
    AnalyticsModule,
    LogisticsModule,
    AdminModule,
    SmsModule,
    CouponModule,
    StaffModule,
    EmailMarketingModule,
    SeoModule,
    BillingModule,
    CustomerModule,
    CustomerAuthModule,
    CustomerAccountModule,
    MarketingModule,
    TrackingModule,
    BlogModule,
    FileModule,
    OmnichannelModule,
    HrmModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
