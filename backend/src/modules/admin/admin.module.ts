import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StoreEntity } from '../tenant/entities/store.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { UserEntity } from '../user/entities/user.entity';
import { GetPlatformStatsService } from './services/get-platform-stats.service';
import { ListAllStoresService } from './services/list-all-stores.service';
import { ToggleStoreStatusService } from './services/toggle-store-status.service';
import { ListAllSystemOrdersService } from './services/list-all-system-orders.service';
import { AdminController } from './admin.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreEntity, OrderEntity, UserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [
    GetPlatformStatsService,
    ListAllStoresService,
    ToggleStoreStatusService,
    ListAllSystemOrdersService,
    JwtAuthGuard,
  ],
  exports: [
    GetPlatformStatsService,
    ListAllStoresService,
    ToggleStoreStatusService,
    ListAllSystemOrdersService,
    TypeOrmModule,
  ],
})
export class AdminModule {}
