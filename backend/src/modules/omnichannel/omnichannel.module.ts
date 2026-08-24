import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { OmnichannelCredentialEntity } from './entities/omnichannel-credential.entity';
import { OmnichannelMessageEntity } from './entities/omnichannel-message.entity';
import { CustomerEntity } from '../customer/entities/customer.entity';
import { TenantModule } from '../tenant/tenant.module';
import { OmnichannelCredentialsService } from './services/omnichannel-credentials.service';
import { TelegramChannelService } from './services/telegram-channel.service';
import { WhatsAppChannelService } from './services/whatsapp-channel.service';
import { FacebookChannelService } from './services/facebook-channel.service';
import { OmnichannelChatService } from './services/omnichannel-chat.service';
import { OmnichannelCredentialsController } from './controllers/omnichannel-credentials.controller';
import { OmnichannelChatController } from './controllers/omnichannel-chat.controller';
import { OmnichannelWebhookController } from './controllers/omnichannel-webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OmnichannelCredentialEntity,
      OmnichannelMessageEntity,
      CustomerEntity,
    ]),
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
  controllers: [
    OmnichannelCredentialsController,
    OmnichannelChatController,
    OmnichannelWebhookController,
  ],
  providers: [
    OmnichannelCredentialsService,
    TelegramChannelService,
    WhatsAppChannelService,
    FacebookChannelService,
    OmnichannelChatService,
  ],
  exports: [
    OmnichannelCredentialsService,
    TelegramChannelService,
    WhatsAppChannelService,
    FacebookChannelService,
    OmnichannelChatService,
    TypeOrmModule,
  ],
})
export class OmnichannelModule {}
