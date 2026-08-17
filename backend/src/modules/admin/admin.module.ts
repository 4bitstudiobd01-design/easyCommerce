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
import { PlatformConfigEntity } from './entities/platform-config.entity';
import { PlatformConfigService } from './services/platform-config.service';
import { ContactMessageEntity } from './entities/contact-message.entity';
import { CreateContactMessageService } from './services/create-contact-message.service';
import { ListContactMessagesService } from './services/list-contact-messages.service';
import { DashboardFacadeService } from './services/dashboard-facade.service';
import { AdminController } from './admin.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreEntity, OrderEntity, UserEntity, PlatformConfigEntity, ContactMessageEntity]),
    SmsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [AdminController, AdminDashboardController],
  providers: [
    GetPlatformStatsService,
    ListAllStoresService,
    ToggleStoreStatusService,
    ListAllSystemOrdersService,
    PlatformConfigService,
    CreateContactMessageService,
    ListContactMessagesService,
    DashboardFacadeService,
    JwtAuthGuard,
  ],
  exports: [
    GetPlatformStatsService,
    ListAllStoresService,
    ToggleStoreStatusService,
    ListAllSystemOrdersService,
    DashboardFacadeService,
    TypeOrmModule,
  ],
})
export class AdminModule {}
