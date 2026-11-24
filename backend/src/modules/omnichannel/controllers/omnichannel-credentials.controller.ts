import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Res,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { UserRoleEnum } from '../../user/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { OmnichannelCredentialsService } from '../services/omnichannel-credentials.service';
import { TikTokChannelService } from '../services/tiktok-channel.service';
import {
  UpsertCredentialDto,
  TestCredentialDto,
  ToggleActiveDto,
} from '../dto/omnichannel.dto';
import { OmnichannelPlatformType } from '../entities/omnichannel-credential.entity';

@ApiTags('Omnichannel Credentials')
@Controller('omnichannel/credentials')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OmnichannelCredentialsController {
  constructor(
    private readonly credentialsService: OmnichannelCredentialsService,
    private readonly tiktokService: TikTokChannelService,
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

  // ─── TikTok Business Messaging OAuth Flow ─────────────────────────────────
  // NOTE: These MUST come before generic :platform routes to avoid wildcard conflicts

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get('tiktok/oauth/url')
  @ApiOperation({ summary: 'Get official TikTok OAuth authorization URL' })
  async getTikTokOAuthUrl(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
    @Query('clientKey') clientKey?: string,
    @Query('clientSecret') clientSecret?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.tiktokService.getOAuthUrl(ctx.tenantId, ctx.storeId, {
      clientKey,
      clientSecret,
    });
    return { success: true, ...data };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post('tiktok/oauth/url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate TikTok OAuth authorization with custom merchant keys' })
  async postTikTokOAuthUrl(
    @CurrentUser('sub') userId: string,
    @Body() body?: { clientKey?: string; clientSecret?: string },
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.tiktokService.getOAuthUrl(ctx.tenantId, ctx.storeId, {
      clientKey: body?.clientKey,
      clientSecret: body?.clientSecret,
    });
    return { success: true, ...data };
  }

  @Public()
  @Get('tiktok/oauth/callback')
  @ApiOperation({ summary: 'Public TikTok OAuth redirect callback receiver' })
  async handleTikTokOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') oauthError: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      // Handle TikTok sending back an error directly (e.g., user denied)
      if (oauthError) {
        const errMsg = errorDescription || oauthError || 'Authorization was denied by TikTok';
        return res.redirect(
          `${frontendUrl}/admin/crm/omnichannel?error=${encodeURIComponent(`tiktok_${errMsg}`)}`,
        );
      }

      if (!code || !state) {
        throw new BadRequestException('Authorization code or state parameter is missing');
      }

      const result = await this.tiktokService.handleOAuthCallback(code, state);

      // Redirect back to Admin UI with success notification
      return res.redirect(
        `${frontendUrl}/admin/crm/omnichannel?connected=tiktok&handle=${encodeURIComponent(
          result.accountHandle,
        )}`,
      );
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to authenticate with TikTok';
      return res.redirect(
        `${frontendUrl}/admin/crm/omnichannel?error=${encodeURIComponent(`tiktok_${errMsg}`)}`,
      );
    }
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post('tiktok/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect connected TikTok Business account' })
  async disconnectTikTok(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const result = await this.tiktokService.disconnect(ctx.tenantId);
    return { success: true, ...result };
  }

  // ─── Generic Platform Credentials Endpoints ────────────────────────────────

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get()
  @ApiOperation({ summary: 'Get all configured channel credentials (masked by default)' })
  async getAllCredentials(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
    @Query('unmask') unmask?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const shouldUnmask = unmask === 'true';
    const data = await this.credentialsService.findAll(ctx.tenantId, !shouldUnmask);
    return { success: true, data };
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save or update channel credentials' })
  async saveCredentials(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpsertCredentialDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.credentialsService.upsert(ctx.tenantId, dto, ctx.storeId);
    return { success: true, data };
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Post(':platform/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Live test connection with channel API' })
  async testConnection(
    @CurrentUser('sub') userId: string,
    @Param('platform') platform: OmnichannelPlatformType,
    @Body() dto?: TestCredentialDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.credentialsService.testConnection(
      ctx.tenantId,
      platform,
      dto?.credentials,
    );
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Patch(':platform/toggle')
  @ApiOperation({ summary: 'Toggle channel active state' })
  async toggleActive(
    @CurrentUser('sub') userId: string,
    @Param('platform') platform: OmnichannelPlatformType,
    @Body() dto: ToggleActiveDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const data = await this.credentialsService.toggleActive(
      ctx.tenantId,
      platform,
      dto.isActive,
    );
    return { success: true, data };
  }

  @Roles(UserRoleEnum.STORE_OWNER)
  @Delete(':platform')
  @ApiOperation({ summary: 'Remove platform credentials' })
  async deleteCredentials(
    @CurrentUser('sub') userId: string,
    @Param('platform') platform: OmnichannelPlatformType,
    @Headers('x-store-id') storeId?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    return this.credentialsService.remove(ctx.tenantId, platform);
  }

  @Roles(UserRoleEnum.STORE_OWNER, UserRoleEnum.STORE_STAFF)
  @Get(':platform')
  @ApiOperation({ summary: 'Get credentials for specific platform' })
  async getByPlatform(
    @CurrentUser('sub') userId: string,
    @Param('platform') platform: OmnichannelPlatformType,
    @Headers('x-store-id') storeId?: string,
    @Query('unmask') unmask?: string,
  ) {
    const ctx = await this.getMerchantTenantContext(userId, storeId);
    const shouldUnmask = unmask === 'true';
    const data = await this.credentialsService.findByPlatform(
      ctx.tenantId,
      platform,
      !shouldUnmask,
    );
    return { success: true, data };
  }
}
