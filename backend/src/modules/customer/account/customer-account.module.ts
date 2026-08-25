import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CustomerEntity } from '../entities/customer.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { TenantModule } from '../../tenant/tenant.module';
import { CustomerModule } from '../customer.module';

import { CustomerAccountController } from './customer-account.controller';
import { GetMyProfileService } from './services/get-my-profile.service';
import { UpdateMyProfileService } from './services/update-my-profile.service';
import { ListMyOrdersService } from './services/list-my-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEntity, OrderEntity]),
    TenantModule,
    CustomerModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [CustomerAccountController],
  providers: [GetMyProfileService, UpdateMyProfileService, ListMyOrdersService],
})
export class CustomerAccountModule {}
