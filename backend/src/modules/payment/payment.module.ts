import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentEntity } from './entities/payment.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { TenantModule } from '../tenant/tenant.module';
import { OrderModule } from '../order/order.module';
import { InitiateSslCommerzPaymentService } from './services/initiate-sslcommerz-payment.service';
import { ValidateSslCommerzPaymentService } from './services/validate-sslcommerz-payment.service';
import { ListMerchantPaymentsService } from './services/list-merchant-payments.service';
import { PaymentController } from './payment.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, OrderEntity]),
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
  controllers: [PaymentController],
  providers: [
    InitiateSslCommerzPaymentService,
    ValidateSslCommerzPaymentService,
    ListMerchantPaymentsService,
    JwtAuthGuard,
  ],
  exports: [
    InitiateSslCommerzPaymentService,
    ValidateSslCommerzPaymentService,
    ListMerchantPaymentsService,
    TypeOrmModule,
  ],
})
export class PaymentModule {}
