import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantEntity } from './entities/tenant.entity';
import { StoreEntity } from './entities/store.entity';
import { ThemePurchaseEntity } from './entities/theme-purchase.entity';
import { UserModule } from '../user/user.module';
import { CreateStoreService } from './services/create-store.service';
import { FindStoreByUserService } from './services/find-store-by-user.service';
import { FindStoreBySlugService } from './services/find-store-by-slug.service';
import { UpdateStoreService } from './services/update-store.service';
import { ListAvailableThemesService } from './services/list-available-themes.service';
import { PurchaseThemeService } from './services/purchase-theme.service';
import { ActivateThemeService } from './services/activate-theme.service';
import { InitiateThemeSslCommerzPaymentService } from './services/initiate-theme-sslcommerz-payment.service';
import { TenantController } from './tenant.controller';
import { ThemeController } from './theme.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, StoreEntity, ThemePurchaseEntity]),
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [TenantController, ThemeController],
  providers: [
    CreateStoreService,
    FindStoreByUserService,
    FindStoreBySlugService,
    UpdateStoreService,
    ListAvailableThemesService,
    PurchaseThemeService,
    ActivateThemeService,
    InitiateThemeSslCommerzPaymentService,
    JwtAuthGuard,
  ],
  exports: [
    CreateStoreService,
    FindStoreByUserService,
    FindStoreBySlugService,
    UpdateStoreService,
    ListAvailableThemesService,
    PurchaseThemeService,
    ActivateThemeService,
    TypeOrmModule,
  ],
})
export class TenantModule {}
