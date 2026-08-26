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
import { OmnichannelCredentialsService } from '../services/omnichannel-credentials.service';
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
}
