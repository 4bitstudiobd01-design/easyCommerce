import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CouponEntity } from './entities/coupon.entity';
import { CreateCouponService } from './services/create-coupon.service';
import { ListMerchantCouponsService } from './services/list-merchant-coupons.service';
import { ValidatePublicCouponService } from './services/validate-public-coupon.service';
import { CouponController } from './coupon.controller';
import { TenantModule } from '../tenant/tenant.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([CouponEntity]),
    TenantModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [CouponController],
  providers: [
    CreateCouponService,
    ListMerchantCouponsService,
    ValidatePublicCouponService,
    JwtAuthGuard,
  ],
  exports: [
    CreateCouponService,
    ListMerchantCouponsService,
    ValidatePublicCouponService,
    TypeOrmModule,
  ],
})
export class CouponModule {}
