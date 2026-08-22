import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { TenantModule } from '../tenant/tenant.module';
import { NotificationModule } from '../../common/notification/notification.module';
import { RegisterMerchantService } from './services/register-merchant.service';
import { LoginService } from './services/login.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RequestPasswordResetService } from './services/request-password-reset.service';
import { ResetPasswordService } from './services/reset-password.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UserModule,
    TenantModule,
    NotificationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterMerchantService,
    LoginService,
    RefreshTokenService,
    RequestPasswordResetService,
    ResetPasswordService,
  ],
  exports: [
    RegisterMerchantService,
    LoginService,
    RefreshTokenService,
    RequestPasswordResetService,
    ResetPasswordService,
    JwtModule,
  ],
})
export class AuthModule {}
