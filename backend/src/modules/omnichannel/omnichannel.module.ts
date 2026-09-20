import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { OmnichannelCredentialEntity } from './entities/omnichannel-credential.entity';
import { OmnichannelMessageEntity } from './entities/omnichannel-message.entity';
import { OmnichannelAiConfigEntity } from './entities/omnichannel-ai-config.entity';
import { OmnichannelConversationStateEntity } from './entities/omnichannel-conversation-state.entity';
import { OmnichannelAiLogEntity } from './entities/omnichannel-ai-log.entity';
import { CustomerEntity } from '../customer/entities/customer.entity';
import { TenantModule } from '../tenant/tenant.module';
import { OmnichannelCredentialsService } from './services/omnichannel-credentials.service';
import { TelegramChannelService } from './services/telegram-channel.service';
import { WhatsAppChannelService } from './services/whatsapp-channel.service';
import { FacebookChannelService } from './services/facebook-channel.service';
import { InstagramChannelService } from './services/instagram-channel.service';
import { TikTokChannelService } from './services/tiktok-channel.service';
import { OmnichannelChatService } from './services/omnichannel-chat.service';
import { OmnichannelAiCryptoService } from './services/omnichannel-ai-crypto.service';
import { GeminiAiProvider } from './services/ai-providers/gemini-ai.provider';
import { OpenAiProvider } from './services/ai-providers/openai-ai.provider';
import { ClaudeAiProvider } from './services/ai-providers/claude-ai.provider';
import { OmnichannelAiConfigService } from './services/omnichannel-ai-config.service';
import { OmnichannelAiAutoReplyService } from './services/omnichannel-ai-auto-reply.service';
import { OmnichannelCredentialsController } from './controllers/omnichannel-credentials.controller';
import { OmnichannelChatController } from './controllers/omnichannel-chat.controller';
import { OmnichannelWebhookController } from './controllers/omnichannel-webhook.controller';
import { OmnichannelAiController } from './controllers/omnichannel-ai.controller';

import { OmnichannelAiDocumentEntity } from './entities/omnichannel-ai-document.entity';
import { OmnichannelAiDocumentChunkEntity } from './entities/omnichannel-ai-document-chunk.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ProductVariantEntity } from '../catalog/entities/product-variant.entity';
import { InventoryStockEntity } from '../inventory/entities/inventory-stock.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { OmnichannelAiRagService } from './services/omnichannel-ai-rag.service';
import { OmnichannelAiToolsService } from './services/omnichannel-ai-tools.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OmnichannelCredentialEntity,
      OmnichannelMessageEntity,
      OmnichannelAiConfigEntity,
      OmnichannelConversationStateEntity,
      OmnichannelAiLogEntity,
      OmnichannelAiDocumentEntity,
      OmnichannelAiDocumentChunkEntity,
      ProductEntity,
      ProductVariantEntity,
      InventoryStockEntity,
      OrderEntity,
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
    OmnichannelAiController,
  ],
  providers: [
    OmnichannelCredentialsService,
    TelegramChannelService,
    WhatsAppChannelService,
    FacebookChannelService,
    InstagramChannelService,
    TikTokChannelService,
    OmnichannelChatService,
    OmnichannelAiCryptoService,
    GeminiAiProvider,
    OpenAiProvider,
    ClaudeAiProvider,
    OmnichannelAiConfigService,
    OmnichannelAiAutoReplyService,
    OmnichannelAiRagService,
    OmnichannelAiToolsService,
  ],
  exports: [
    OmnichannelCredentialsService,
    TelegramChannelService,
    WhatsAppChannelService,
    FacebookChannelService,
    InstagramChannelService,
    TikTokChannelService,
    OmnichannelChatService,
    OmnichannelAiAutoReplyService,
    OmnichannelAiConfigService,
    TypeOrmModule,
  ],
})
export class OmnichannelModule {}
