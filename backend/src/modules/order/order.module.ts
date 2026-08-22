import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderNumberSequenceEntity } from './entities/order-number-sequence.entity';
import { OrderStatusHistoryEntity } from './entities/order-status-history.entity';
import { ReturnEntity } from './entities/return.entity';
import { ReturnItemEntity } from './entities/return-item.entity';
import { AbandonedCartEntity } from './entities/abandoned-cart.entity';
import { OrderNoteEntity } from './entities/order-note.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ConsignmentEntity } from '../logistics/entities/consignment.entity';
import { TenantModule } from '../tenant/tenant.module';
import { CustomerModule } from '../customer/customer.module';
import { CatalogModule } from '../catalog/catalog.module';
import { InventoryModule } from '../inventory/inventory.module';
import { SmsModule } from '../sms/sms.module';
import { CouponModule } from '../coupon/coupon.module';
import { CreateOrderService } from './services/create-order.service';
import { ListMerchantOrdersService } from './services/list-merchant-orders.service';
import { OrderKpiService } from './services/order-kpi.service';
import { FindOrderByIdService } from './services/find-order-by-id.service';
import { UpdateOrderStatusService } from './services/update-order-status.service';
import { TrackPublicOrderService } from './services/track-public-order.service';
import { GenerateOrderInvoiceService } from './services/generate-order-invoice.service';
import { GenerateThermalLabelService } from './services/generate-thermal-label.service';
import { AbandonedCartService } from './services/abandoned-cart.service';
import { EditOrderService } from './services/edit-order.service';
import { OrderStateService } from './services/order-state.service';
import { OrderCalculationService } from './services/order-calculation.service';
import { CollectCodService } from './services/collect-cod.service';
import { CreateReturnService } from './services/create-return.service';
import { UpdateReturnStatusService } from './services/update-return-status.service';
import { FindReturnsByOrderService } from './services/find-returns-by-order.service';
import { OrderController } from './order.controller';
import { AbandonedCartController } from './controllers/abandoned-cart.controller';
import { ReturnController } from './controllers/return.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentEntity } from '../payment/entities/payment.entity';
import { BulkOrderController } from './controllers/bulk-order.controller';
import { BulkUpdateOrderStatusService } from './services/bulk-update-order-status.service';
import { ExportOrdersService } from './services/export-orders.service';
import { OrderNoteController } from './controllers/order-note.controller';
import { OrderNoteService } from './services/order-note.service';
import { OrderTimelineService } from './services/order-timeline.service';
import { GenerateOrderNumberService } from './services/generate-order-number.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      OrderNumberSequenceEntity,
      OrderStatusHistoryEntity,
      ReturnEntity,
      ReturnItemEntity,
      AbandonedCartEntity,
      OrderNoteEntity,
      ProductEntity,
      ConsignmentEntity,
      PaymentEntity,
    ]),
    TenantModule,
    CustomerModule,
    CatalogModule,
    InventoryModule,
    SmsModule,
    CouponModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [OrderController, AbandonedCartController, ReturnController, BulkOrderController, OrderNoteController],
  providers: [
    CreateOrderService,
    ListMerchantOrdersService,
    OrderKpiService,
    FindOrderByIdService,
    UpdateOrderStatusService,
    TrackPublicOrderService,
    GenerateOrderInvoiceService,
    GenerateThermalLabelService,
    AbandonedCartService,
    OrderStateService,
    OrderCalculationService,
    EditOrderService,
    CollectCodService,
    JwtAuthGuard,
    CreateReturnService,
    UpdateReturnStatusService,
    FindReturnsByOrderService,
    BulkUpdateOrderStatusService,
    ExportOrdersService,
    OrderNoteService,
    OrderTimelineService,
    GenerateOrderNumberService,
  ],
  exports: [
    CreateOrderService,
    ListMerchantOrdersService,
    OrderKpiService,
    FindOrderByIdService,
    UpdateOrderStatusService,
    TrackPublicOrderService,
    AbandonedCartService,
    OrderStateService,
    OrderCalculationService,
    EditOrderService,
    CollectCodService,
    TypeOrmModule,
  ],
})
export class OrderModule {}
