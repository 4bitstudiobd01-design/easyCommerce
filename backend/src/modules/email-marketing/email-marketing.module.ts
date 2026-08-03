import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NewsletterSubscriberEntity } from './entities/newsletter-subscriber.entity';
import { EmailCampaignEntity } from './entities/email-campaign.entity';
import { StoreEntity } from '../tenant/entities/store.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { TenantModule } from '../tenant/tenant.module';
import { SmsModule } from '../sms/sms.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailMarketingController } from './email-marketing.controller';

import { SubscribeNewsletterService } from './services/subscribe-newsletter.service';
import { ListSubscribersService } from './services/list-subscribers.service';
import { CreateCampaignService } from './services/create-campaign.service';
import { ListCampaignsService } from './services/list-campaigns.service';
import { SendCampaignBroadcastService } from './services/send-campaign-broadcast.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NewsletterSubscriberEntity,
      EmailCampaignEntity,
      StoreEntity,
      OrderEntity,
    ]),
    TenantModule,
    SmsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [EmailMarketingController],
  providers: [
    SubscribeNewsletterService,
    ListSubscribersService,
    CreateCampaignService,
    ListCampaignsService,
    SendCampaignBroadcastService,
    JwtAuthGuard,
  ],
  exports: [
    SubscribeNewsletterService,
    ListSubscribersService,
    CreateCampaignService,
    ListCampaignsService,
    SendCampaignBroadcastService,
  ],
})
export class EmailMarketingModule {}
