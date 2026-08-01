import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
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
