import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentEntity } from './entities/payment.entity';
import { RefundEntity } from './entities/refund.entity';
import { PaymentEventEntity } from './entities/payment-event.entity';
import { PaymentGatewayEntity } from './entities/payment-gateway.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { TenantModule } from '../tenant/tenant.module';
import { OrderModule } from '../order/order.module';
import { StaffModule } from '../staff/staff.module';
import { InitiateSslCommerzPaymentService } from './services/initiate-sslcommerz-payment.service';
import { ValidateSslCommerzPaymentService } from './services/validate-sslcommerz-payment.service';
import { ListMerchantPaymentsService } from './services/list-merchant-payments.service';
import { PaymentDomainService } from './services/payment-domain.service';
import { ListPaymentTransactionsService } from './services/list-payment-transactions.service';
import { GetPaymentSummaryService } from './services/get-payment-summary.service';
import { GetPaymentDetailsService } from './services/get-payment-details.service';
import { ListPaymentGatewaysService } from './services/list-payment-gateways.service';
import { ExportPaymentTransactionsService } from './services/export-payment-transactions.service';
import { RecordPaymentEventService } from './services/record-payment-event.service';
import { SeedPaymentDemoDataService } from './services/seed-payment-demo-data.service';
import { PaymentController } from './payment.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

import { CreateRefundService } from './services/create-refund.service';
import { ProcessRefundService } from './services/process-refund.service';
import { FindRefundsByOrderService } from './services/find-refunds-by-order.service';
import { GetRefundsSummaryService } from './services/get-refunds-summary.service';
import { RefundController } from './controllers/refund.controller';
import { OrderStatusHistoryEntity } from '../order/entities/order-status-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      OrderEntity,
      RefundEntity,
      OrderStatusHistoryEntity,
      PaymentEventEntity,
      PaymentGatewayEntity,
    ]),
    TenantModule,
    OrderModule,
    // Supplies GetMyPermissionsService, which PermissionsGuard resolves per request.
    StaffModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [PaymentController, RefundController],
  providers: [
    InitiateSslCommerzPaymentService,
    ValidateSslCommerzPaymentService,
    ListMerchantPaymentsService,
    PaymentDomainService,
    ListPaymentTransactionsService,
    GetPaymentSummaryService,
    GetPaymentDetailsService,
    ListPaymentGatewaysService,
    ExportPaymentTransactionsService,
    RecordPaymentEventService,
    SeedPaymentDemoDataService,
    JwtAuthGuard,
    PermissionsGuard,
    CreateRefundService,
    ProcessRefundService,
    FindRefundsByOrderService,
    GetRefundsSummaryService,
  ],
  exports: [
    InitiateSslCommerzPaymentService,
    ValidateSslCommerzPaymentService,
    ListMerchantPaymentsService,
    PaymentDomainService,
    ListPaymentTransactionsService,
    GetPaymentSummaryService,
    GetPaymentDetailsService,
    ListPaymentGatewaysService,
    ExportPaymentTransactionsService,
    RecordPaymentEventService,
    CreateRefundService,
    ProcessRefundService,
    FindRefundsByOrderService,
    GetRefundsSummaryService,
    TypeOrmModule,
  ],
})
export class PaymentModule {}
