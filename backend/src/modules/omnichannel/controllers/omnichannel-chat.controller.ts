import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../../user/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { OmnichannelChatService } from '../services/omnichannel-chat.service';
import { TelegramChannelService } from '../services/telegram-channel.service';
import { SendMessageDto } from '../dto/omnichannel.dto';

@ApiTags('Omnichannel Chat')
@Controller('omnichannel/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OmnichannelChatController {
  constructor(
    private readonly chatService: OmnichannelChatService,
    private readonly telegramService: TelegramChannelService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantContext(
    userId: string,
    storeId?: string,
  ): Promise<{ tenantId: string; storeId?: string }> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store first.');
    }
    return { tenantId: store.tenantId, storeId: store.id };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('conversations')
  @ApiOperation({ summary: 'Get unified conversations list across all connected channels' })
  async getConversations(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
    @Query('platform') platform?: string,
    @Query('search') search?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.chatService.getConversations(
      ctx.tenantId,
      platform,
      search,
    );
    return { success: true, data };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get message thread history for a conversation' })
  async getConversationMessages(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.chatService.getMessagesByConversation(
      ctx.tenantId,
      conversationId,
    );
    return { success: true, data };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send outbound message to channel user' })
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Body() dto: SendMessageDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.chatService.sendMessage(
      ctx.tenantId,
      dto.platform,
      dto.recipientId,
      dto.text,
      ctx.storeId,
      dto.conversationId,
    );
    return { success: true, data };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get(['telegram/bot-info', 'telegram/info'])
  @ApiOperation({ summary: 'Get Telegram bot info for merchant' })
  async getTelegramBotInfo(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const bot = await this.telegramService.getBotInfo(ctx.tenantId);
    return { success: true, data: { bot } };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('telegram/send-direct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Direct send message to a Telegram chat ID' })
  async sendDirectTelegram(
    @CurrentUser('sub') userId: string,
    @Body() body: { chatId: string | number; text: string },
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.telegramService.sendMessage(
      ctx.tenantId,
      body.chatId,
      body.text,
      ctx.storeId,
    );
    return { success: true, data };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('sync/:platform')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync historical conversations from channel API' })
  async syncPlatform(
    @CurrentUser('sub') userId: string,
    @Param('platform') platform: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.chatService.syncPlatformConversations(
      ctx.tenantId,
      platform,
      ctx.storeId,
    );
  }
}
