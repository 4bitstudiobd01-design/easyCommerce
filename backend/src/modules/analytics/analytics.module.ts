import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderEntity } from '../order/entities/order.entity';
import { OrderItemEntity } from '../order/entities/order-item.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { TenantModule } from '../tenant/tenant.module';
import { OrderModule } from '../order/order.module';
import { GetMerchantAnalyticsService } from './services/get-merchant-analytics.service';
import { NetProfitService } from './services/net-profit.service';
import { AnalyticsController } from './analytics.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, ProductEntity]),
    TenantModule,
    OrderModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [AnalyticsController],
  providers: [GetMerchantAnalyticsService, NetProfitService, JwtAuthGuard],
  exports: [GetMerchantAnalyticsService, NetProfitService, TypeOrmModule],
})
export class AnalyticsModule {}
