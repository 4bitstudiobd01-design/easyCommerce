import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../../user/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { OmnichannelAiConfigService } from '../services/omnichannel-ai-config.service';
import { OmnichannelAiAutoReplyService } from '../services/omnichannel-ai-auto-reply.service';
import { OmnichannelAiRagService } from '../services/omnichannel-ai-rag.service';
import { OmnichannelAiToolsService } from '../services/omnichannel-ai-tools.service';
import {
  SaveAiConfigDto,
  TestAiConnectionDto,
  ToggleConversationAiDto,
} from '../dto/omnichannel-ai.dto';

@ApiTags('Omnichannel AI Auto-Reply & RAG')
@Controller('omnichannel/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OmnichannelAiController {
  constructor(
    private readonly aiConfigService: OmnichannelAiConfigService,
    private readonly autoReplyService: OmnichannelAiAutoReplyService,
    private readonly ragService: OmnichannelAiRagService,
    private readonly toolsService: OmnichannelAiToolsService,
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
    return this.aiConfigService.saveConfig(ctx.tenantId, dto, ctx.storeId);
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
    return this.aiConfigService.testConnection(ctx.tenantId, dto, ctx.storeId);
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
  @Post('conversations/:id/suggest')
  @ApiOperation({ summary: 'Generate AI smart draft reply for agent review & insertion' })
  async generateDraftReply(
    @CurrentUser('sub') userId: string,
    @Param('id') conversationId: string,
    @Headers('x-store-id') storeId?: string,
    @Body() dto: { promptOverride?: string; provider?: string; model?: string } = {},
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.autoReplyService.generateDraftReply(
      ctx.tenantId,
      conversationId,
      dto.promptOverride,
      dto.provider,
      dto.model,
    );
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

  // ─── Multi-Tenant RAG Knowledge Base & Documents ────────────────────────────

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('documents')
  @ApiOperation({ summary: 'List all knowledge base documents uploaded for this store' })
  async listDocuments(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.ragService.listDocuments(ctx.tenantId, ctx.storeId);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF, UserRoleEnum.SUPER_ADMIN)
  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload and index a PDF/document into the store RAG vector knowledge base' })
  async uploadDocument(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    if (!ctx.storeId) {
      throw new BadRequestException('Active Store ID is required for document indexing.');
    }
    const { apiKey, provider } = await this.aiConfigService.getDecryptedApiKeyForTenant(ctx.tenantId);

    return this.ragService.uploadAndIndexDocument(
      ctx.tenantId,
      ctx.storeId,
      file,
      apiKey || undefined,
      provider,
    );
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF, UserRoleEnum.SUPER_ADMIN)
  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete a knowledge base document and its vector chunks' })
  async deleteDocument(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string,
    @Param('id') documentId: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    if (!ctx.storeId) {
      throw new BadRequestException('Active Store ID is required.');
    }
    await this.ragService.deleteDocument(ctx.tenantId, ctx.storeId, documentId);
    return { success: true, message: 'Document deleted successfully.' };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('tools/execute')
  @ApiOperation({ summary: 'Test execute a store AI tool (Product inventory, order tracking)' })
  async executeTool(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId: string,
    @Body() dto: { toolName: string; args: Record<string, any> },
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.toolsService.executeTool(dto.toolName, dto.args, ctx.tenantId, ctx.storeId);
  }
}
