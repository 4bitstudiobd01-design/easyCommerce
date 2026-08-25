import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CustomerEntity } from '../entities/customer.entity';
import { CustomerSessionEntity } from '../entities/customer-session.entity';
import { TenantModule } from '../../tenant/tenant.module';

import { CustomerAuthController } from './customer-auth.controller';
import { RegisterCustomerService } from './services/register-customer.service';
import { CustomerLoginService } from './services/customer-login.service';
import { CustomerRefreshTokenService } from './services/customer-refresh-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEntity, CustomerSessionEntity]),
    TenantModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [CustomerAuthController],
  providers: [RegisterCustomerService, CustomerLoginService, CustomerRefreshTokenService],
})
export class CustomerAuthModule {}
