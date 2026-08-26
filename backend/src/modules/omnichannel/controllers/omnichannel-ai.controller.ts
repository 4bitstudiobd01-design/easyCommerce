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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../../user/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { OmnichannelAiConfigService } from '../services/omnichannel-ai-config.service';
import { OmnichannelAiAutoReplyService } from '../services/omnichannel-ai-auto-reply.service';
import {
  SaveAiConfigDto,
  TestAiConnectionDto,
  ToggleConversationAiDto,
} from '../dto/omnichannel-ai.dto';

@ApiTags('Omnichannel AI Auto-Reply')
@Controller('omnichannel/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OmnichannelAiController {
  constructor(
    private readonly aiConfigService: OmnichannelAiConfigService,
    private readonly autoReplyService: OmnichannelAiAutoReplyService,
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
  @Get('config')
  @ApiOperation({ summary: 'Get AI Auto-Reply configuration for tenant' })
  async getConfig(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.aiConfigService.getConfig(ctx.tenantId);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post('config')
  @ApiOperation({ summary: 'Save AI Auto-Reply configuration (encrypts API Key)' })
  async saveConfig(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
    @Body() dto: SaveAiConfigDto = {},
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.aiConfigService.saveConfig(ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post('test')
  @ApiOperation({ summary: 'Test AI Provider connection and model latency' })
  async testConnection(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
    @Body() dto: TestAiConnectionDto = {},
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.aiConfigService.testConnection(ctx.tenantId, dto);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('logs')
  @ApiOperation({ summary: 'Get recent AI Auto-Reply activity logs' })
  async getLogs(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
    @Query('limit') limit?: number,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.aiConfigService.getLogs(ctx.tenantId, limit ? Number(limit) : 50);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('conversations/:id/state')
  @ApiOperation({ summary: 'Get AI pause state for a specific conversation' })
  async getConversationState(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string,
    @Param('id') conversationId: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.autoReplyService.getConversationAiState(ctx.tenantId, conversationId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('conversations/:id/toggle')
  @ApiOperation({ summary: 'Pause or Resume AI Auto-Reply for a specific conversation' })
  async toggleConversationState(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string,
    @Param('id') conversationId: string,
    @Body() dto: ToggleConversationAiDto,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.autoReplyService.toggleConversationAiState(
      ctx.tenantId,
      conversationId,
      dto.isPaused,
      userId,
    );
  }
}
