import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlanEntity } from './entities/plan.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { SubscriptionInvoiceEntity } from './entities/subscription-invoice.entity';
import { StoreEntity } from '../tenant/entities/store.entity';
import { StaffMemberEntity } from '../staff/entities/staff.entity';
import { UserEntity } from '../user/entities/user.entity';
import { PlanSeederService } from './services/plan-seeder.service';
import { GetTenantIdForUserService } from './services/get-tenant-id-for-user.service';
import { GetMySubscriptionService } from './services/get-my-subscription.service';
import { ListPlansService } from './services/list-plans.service';
import { EnforcePlanLimitService } from './services/enforce-plan-limit.service';
import { InitiatePlanRenewalPaymentService } from './services/initiate-plan-renewal-payment.service';
import { ValidatePlanRenewalPaymentService } from './services/validate-plan-renewal-payment.service';
import { ExpireOverdueSubscriptionsService } from './services/expire-overdue-subscriptions.service';
import { BillingController } from './billing.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanEntity,
      SubscriptionEntity,
      SubscriptionInvoiceEntity,
      StoreEntity,
      StaffMemberEntity,
      UserEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [BillingController],
  providers: [
    PlanSeederService,
    GetTenantIdForUserService,
    GetMySubscriptionService,
    ListPlansService,
    EnforcePlanLimitService,
    InitiatePlanRenewalPaymentService,
    ValidatePlanRenewalPaymentService,
    ExpireOverdueSubscriptionsService,
    JwtAuthGuard,
  ],
  exports: [
    GetTenantIdForUserService,
    GetMySubscriptionService,
    EnforcePlanLimitService,
    TypeOrmModule,
  ],
})
export class BillingModule {}
