import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateStoreService } from './services/create-store.service';
import { FindStoreByUserService } from './services/find-store-by-user.service';
import { FindStoreBySlugService } from './services/find-store-by-slug.service';
import { UpdateStoreService } from './services/update-store.service';
import { DeleteStoreService } from './services/delete-store.service';
import { ManageDeliveryZonesService } from './services/manage-delivery-zones.service';
import { ManageApiKeysService } from './services/manage-api-keys.service';
import { ManageWebhooksService } from './services/manage-webhooks.service';
import { CreateBranchService } from './services/create-branch.service';
import { ListBranchesService } from './services/list-branches.service';
import { UpdateBranchService } from './services/update-branch.service';
import { DeleteBranchService } from './services/delete-branch.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { DeleteStoreDto } from './dto/delete-store.dto';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from './dto/delivery-zone.dto';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StoreEntity } from './entities/store.entity';
import { sanitizePublicStore } from './utils/sanitize-public-store.util';

@ApiTags('Tenant & Stores')
@Controller('stores')
export class TenantController {
  constructor(
    private readonly createStoreService: CreateStoreService,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly findStoreBySlugService: FindStoreBySlugService,
    private readonly updateStoreService: UpdateStoreService,
    private readonly deleteStoreService: DeleteStoreService,
    private readonly manageDeliveryZonesService: ManageDeliveryZonesService,
    private readonly manageApiKeysService: ManageApiKeysService,
    private readonly manageWebhooksService: ManageWebhooksService,
    private readonly createBranchService: CreateBranchService,
    private readonly listBranchesService: ListBranchesService,
    private readonly updateBranchService: UpdateBranchService,
    private readonly deleteBranchService: DeleteBranchService,
  ) {}

  /** Resolves the caller's store, so every sub-resource stays tenant-scoped. */
  private async requireStore(userId: string, storeIdHeader?: string): Promise<StoreEntity> {
    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant must create a store first.');
    }
    return store;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new merchant store & tenant organization' })
  @ApiResponse({ status: 201, type: StoreResponseDto, description: 'Store created successfully' })
  async createStore(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateStoreDto,
  ): Promise<StoreResponseDto> {
    return this.createStoreService.execute(userId, dto);
  }

  @Get('my-stores')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all stores owned by logged-in merchant' })
  @ApiResponse({ status: 200, description: 'List of merchant stores' })
  async getMyStores(@CurrentUser('sub') userId: string): Promise<StoreEntity[]> {
    return this.findStoreByUserService.findAllStoresByUser(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active store profile of current logged-in merchant' })
  @ApiResponse({ status: 200, description: 'Store profile details' })
  async getMyStore(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<StoreEntity | null> {
    return this.findStoreByUserService.execute(userId, storeId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store configuration and courier credentials' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  async updateMyStore(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateStoreDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<StoreEntity> {
    return this.updateStoreService.execute(userId, dto, storeId);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently close the merchant store (requires password confirmation)' })
  @ApiResponse({ status: 200, description: 'Store closed successfully' })
  @ApiResponse({ status: 400, description: 'Store name confirmation did not match' })
  @ApiResponse({ status: 401, description: 'Incorrect password' })
  async deleteMyStore(
    @CurrentUser('sub') userId: string,
    @Body() dto: DeleteStoreDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.deleteStoreService.execute(userId, dto);
  }

  // --- Delivery Zones ---

  @Get('me/delivery-zones')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List delivery zones for the current store' })
  @ApiResponse({ status: 200, description: 'Delivery zones' })
  async listDeliveryZones(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageDeliveryZonesService.list(store.tenantId, store.id);
  }

  @Post('me/delivery-zones')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a delivery zone' })
  @ApiResponse({ status: 201, description: 'Delivery zone created' })
  async createDeliveryZone(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateDeliveryZoneDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageDeliveryZonesService.create(store.tenantId, store.id, dto);
  }

  @Patch('me/delivery-zones/:zoneId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a delivery zone' })
  @ApiResponse({ status: 200, description: 'Delivery zone updated' })
  async updateDeliveryZone(
    @CurrentUser('sub') userId: string,
    @Param('zoneId') zoneId: string,
    @Body() dto: UpdateDeliveryZoneDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageDeliveryZonesService.update(store.tenantId, zoneId, dto);
  }

  @Delete('me/delivery-zones/:zoneId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a delivery zone' })
  @ApiResponse({ status: 200, description: 'Delivery zone deleted' })
  async deleteDeliveryZone(
    @CurrentUser('sub') userId: string,
    @Param('zoneId') zoneId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageDeliveryZonesService.remove(store.tenantId, zoneId);
  }

  // --- Branches ---

  @Get('me/branches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List branches (physical outlets) for the current store' })
  @ApiResponse({ status: 200, description: 'Branches' })
  async listBranches(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.listBranchesService.execute(store.tenantId, store.id);
  }

  @Post('me/branches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a branch' })
  @ApiResponse({ status: 201, description: 'Branch created' })
  async createBranch(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateBranchDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.createBranchService.execute(store.tenantId, store.id, dto);
  }

  @Patch('me/branches/:branchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({ status: 200, description: 'Branch updated' })
  async updateBranch(
    @CurrentUser('sub') userId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.updateBranchService.execute(store.tenantId, store.id, branchId, dto);
  }

  @Delete('me/branches/:branchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({ status: 200, description: 'Branch deleted' })
  async deleteBranch(
    @CurrentUser('sub') userId: string,
    @Param('branchId') branchId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.deleteBranchService.execute(store.tenantId, store.id, branchId);
  }

  // --- API Keys ---

  @Get('me/api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List API keys (hashes only — plaintext is never recoverable)' })
  @ApiResponse({ status: 200, description: 'API keys' })
  async listApiKeys(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageApiKeysService.list(store.tenantId, store.id);
  }

  @Post('me/api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate an API key — the plaintext is returned only in this response' })
  @ApiResponse({ status: 201, description: 'API key created' })
  async createApiKey(
    @CurrentUser('sub') userId: string,
    @Body('name') name: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    if (!name?.trim()) {
      throw new BadRequestException('A name is required to identify the API key.');
    }
    return this.manageApiKeysService.create(store.tenantId, store.id, name.trim());
  }

  @Delete('me/api-keys/:keyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  async revokeApiKey(
    @CurrentUser('sub') userId: string,
    @Param('keyId') keyId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageApiKeysService.revoke(store.tenantId, keyId);
  }

  // --- Webhooks ---

  @Get('me/webhooks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List webhook endpoints' })
  @ApiResponse({ status: 200, description: 'Webhooks' })
  async listWebhooks(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageWebhooksService.list(store.tenantId, store.id);
  }

  @Post('me/webhooks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Webhook created' })
  async createWebhook(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateWebhookDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageWebhooksService.create(store.tenantId, store.id, dto);
  }

  @Patch('me/webhooks/:webhookId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  async updateWebhook(
    @CurrentUser('sub') userId: string,
    @Param('webhookId') webhookId: string,
    @Body() dto: UpdateWebhookDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageWebhooksService.update(store.tenantId, webhookId, dto);
  }

  @Delete('me/webhooks/:webhookId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  async deleteWebhook(
    @CurrentUser('sub') userId: string,
    @Param('webhookId') webhookId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageWebhooksService.remove(store.tenantId, webhookId);
  }

  @Post('me/webhooks/:webhookId/test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a signed test event to a webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Test event dispatch result' })
  async testWebhook(
    @CurrentUser('sub') userId: string,
    @Param('webhookId') webhookId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.requireStore(userId, storeId);
    return this.manageWebhooksService.sendTest(store.tenantId, webhookId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get store details by subdomain slug' })
  @ApiResponse({ status: 200, description: 'Public store profile' })
  async getStoreBySlug(@Param('slug') slug: string): Promise<StoreEntity> {
    const store = await this.findStoreBySlugService.execute(slug);
    return sanitizePublicStore(store);
  }
}
