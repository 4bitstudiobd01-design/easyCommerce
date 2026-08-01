import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ConsignmentEntity } from '../logistics/entities/consignment.entity';
import { TenantModule } from '../tenant/tenant.module';
import { CatalogModule } from '../catalog/catalog.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CreateOrderService } from './services/create-order.service';
import { ListMerchantOrdersService } from './services/list-merchant-orders.service';
import { FindOrderByIdService } from './services/find-order-by-id.service';
import { UpdateOrderStatusService } from './services/update-order-status.service';
import { TrackPublicOrderService } from './services/track-public-order.service';
import { OrderController } from './order.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      ProductEntity,
      ConsignmentEntity,
    ]),
    TenantModule,
    CatalogModule,
    InventoryModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [OrderController],
  providers: [
    CreateOrderService,
    ListMerchantOrdersService,
    FindOrderByIdService,
    UpdateOrderStatusService,
    TrackPublicOrderService,
    JwtAuthGuard,
  ],
  exports: [
    CreateOrderService,
    ListMerchantOrdersService,
    FindOrderByIdService,
    UpdateOrderStatusService,
    TrackPublicOrderService,
    TypeOrmModule,
  ],
})
export class OrderModule {}
