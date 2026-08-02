import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { AbandonedCartEntity } from './entities/abandoned-cart.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ConsignmentEntity } from '../logistics/entities/consignment.entity';
import { TenantModule } from '../tenant/tenant.module';
import { CatalogModule } from '../catalog/catalog.module';
import { InventoryModule } from '../inventory/inventory.module';
import { SmsModule } from '../sms/sms.module';
import { CreateOrderService } from './services/create-order.service';
import { ListMerchantOrdersService } from './services/list-merchant-orders.service';
import { FindOrderByIdService } from './services/find-order-by-id.service';
import { UpdateOrderStatusService } from './services/update-order-status.service';
import { TrackPublicOrderService } from './services/track-public-order.service';
import { GenerateOrderInvoiceService } from './services/generate-order-invoice.service';
import { GenerateThermalLabelService } from './services/generate-thermal-label.service';
import { AbandonedCartService } from './services/abandoned-cart.service';
import { OrderController } from './order.controller';
import { AbandonedCartController } from './controllers/abandoned-cart.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      AbandonedCartEntity,
      ProductEntity,
      ConsignmentEntity,
    ]),
    TenantModule,
    CatalogModule,
    InventoryModule,
    SmsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [OrderController, AbandonedCartController],
  providers: [
    CreateOrderService,
    ListMerchantOrdersService,
    FindOrderByIdService,
    UpdateOrderStatusService,
    TrackPublicOrderService,
    GenerateOrderInvoiceService,
    GenerateThermalLabelService,
    AbandonedCartService,
    JwtAuthGuard,
  ],
  exports: [
    CreateOrderService,
    ListMerchantOrdersService,
    FindOrderByIdService,
    UpdateOrderStatusService,
    TrackPublicOrderService,
    AbandonedCartService,
    TypeOrmModule,
  ],
})
export class OrderModule {}
