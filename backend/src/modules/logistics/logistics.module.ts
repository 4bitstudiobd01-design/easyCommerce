import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsignmentEntity } from './entities/consignment.entity';
import { ConsignmentEventEntity } from './entities/consignment-event.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../order/entities/order-status-history.entity';
import { StoreEntity } from '../tenant/entities/store.entity';
import { TenantModule } from '../tenant/tenant.module';
import { OrderModule } from '../order/order.module';
import { CreateCourierBookingService } from './services/create-courier-booking.service';
import { ListMerchantConsignmentsService } from './services/list-merchant-consignments.service';
import { SyncConsignmentService } from './services/sync-consignment.service';
import { SteadfastCourierAdapter } from './adapters/steadfast.adapter';
import { PathaoCourierAdapter } from './adapters/pathao.adapter';
import { LogisticsController } from './logistics.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsignmentEntity, ConsignmentEventEntity, OrderEntity, StoreEntity, OrderStatusHistoryEntity]),
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
  controllers: [LogisticsController],
  providers: [
    CreateCourierBookingService,
    ListMerchantConsignmentsService,
    SyncConsignmentService,
    SteadfastCourierAdapter,
    PathaoCourierAdapter,
    JwtAuthGuard,
  ],
  exports: [
    CreateCourierBookingService,
    ListMerchantConsignmentsService,
    SyncConsignmentService,
    SteadfastCourierAdapter,
    PathaoCourierAdapter,
    TypeOrmModule,
  ],
})
export class LogisticsModule {}
