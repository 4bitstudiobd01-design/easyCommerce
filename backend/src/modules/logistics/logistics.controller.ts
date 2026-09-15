import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Res,
  Headers,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { StoreEntity } from '../tenant/entities/store.entity';

import { CreateShipmentService } from './services/create-shipment.service';
import { ListShipmentsService } from './services/list-shipments.service';
import { GetShipmentSummaryService } from './services/get-shipment-summary.service';
import { GetShipmentDetailsService } from './services/get-shipment-details.service';
import { CancelShipmentService } from './services/cancel-shipment.service';
import { ExportShipmentsService } from './services/export-shipments.service';
import { SyncConsignmentService } from './services/sync-consignment.service';
import { ListCourierIntegrationsService } from './services/list-courier-integrations.service';
import { GetCourierIntegrationService } from './services/get-courier-integration.service';
import { UpsertCourierIntegrationService } from './services/upsert-courier-integration.service';
import { ToggleCourierIntegrationService } from './services/toggle-courier-integration.service';
import { SetDefaultCourierService } from './services/set-default-courier.service';
import { TestCourierConnectionService } from './services/test-courier-connection.service';
import { PathaoStoreService } from './services/pathao-store.service';
import { PathaoLocationService } from './services/pathao-location.service';
import { PathaoPriceService } from './services/pathao-price.service';
import { RedxAreaService } from './services/redx-area.service';
import { RedxChargeService } from './services/redx-charge.service';
import { RedxStoreService } from './services/redx-store.service';
import { PaperflyExchangeService } from './services/paperfly-exchange.service';
import { CourierProviderRegistry } from './adapters/courier-provider.registry';
import { CourierProviderEnum } from './entities/consignment.entity';

import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CancelShipmentDto } from './dto/cancel-shipment.dto';
import { ListShipmentsQueryDto } from './dto/list-shipments-query.dto';
import { ShipmentListResponseDto } from './dto/shipment-list-response.dto';
import { ShipmentSummaryResponseDto } from './dto/shipment-summary-response.dto';
import { ShipmentDetailsResponseDto } from './dto/shipment-details-response.dto';
import {
  UpsertCourierIntegrationDto,
  ToggleCourierIntegrationDto,
} from './dto/upsert-courier-integration.dto';
import {
  CouriersDashboardResponseDto,
  CourierIntegrationDto,
  CourierConnectionTestResponseDto,
} from './dto/courier-integration-response.dto';
import {
  CreatePathaoStoreDto,
  CreatePathaoStoreResponseDto,
  PathaoStoreDto,
} from './dto/pathao-store.dto';
import { PathaoAreaDto, PathaoCityDto, PathaoZoneDto } from './dto/pathao-location.dto';
import { CalculatePathaoPriceDto, PathaoPriceDto } from './dto/pathao-price.dto';
import { RedxAreaDto } from './dto/redx-area.dto';
import { CalculateRedxChargeDto, RedxChargeDto } from './dto/redx-charge.dto';
import { CreateRedxStoreDto, RedxStoreDto } from './dto/redx-store.dto';
import { CreatePaperflyExchangeOrderDto, PaperflyExchangeOrderResultDto } from './dto/paperfly-exchange.dto';

/**
 * Courier & shipment endpoints for the merchant admin.
 *
 * Every handler resolves the caller's tenant first and passes it into the
 * service layer — no query in this module runs unscoped, so one merchant can
 * never read or mutate another merchant's shipments. Authorisation is enforced
 * here on the server; hiding a button in the UI is never the control.
 */
@ApiTags('Logistics & Courier')
@Controller('logistics')
export class LogisticsController {
  constructor(
    private readonly createShipmentService: CreateShipmentService,
    private readonly listShipmentsService: ListShipmentsService,
    private readonly getShipmentSummaryService: GetShipmentSummaryService,
    private readonly getShipmentDetailsService: GetShipmentDetailsService,
    private readonly cancelShipmentService: CancelShipmentService,
    private readonly exportShipmentsService: ExportShipmentsService,
    private readonly syncConsignmentService: SyncConsignmentService,
    private readonly listCourierIntegrationsService: ListCourierIntegrationsService,
    private readonly getCourierIntegrationService: GetCourierIntegrationService,
    private readonly upsertCourierIntegrationService: UpsertCourierIntegrationService,
    private readonly toggleCourierIntegrationService: ToggleCourierIntegrationService,
    private readonly setDefaultCourierService: SetDefaultCourierService,
    private readonly testCourierConnectionService: TestCourierConnectionService,
    private readonly pathaoStoreService: PathaoStoreService,
    private readonly pathaoLocationService: PathaoLocationService,
    private readonly pathaoPriceService: PathaoPriceService,
    private readonly redxAreaService: RedxAreaService,
    private readonly redxChargeService: RedxChargeService,
    private readonly redxStoreService: RedxStoreService,
    private readonly paperflyExchangeService: PaperflyExchangeService,
    private readonly courierProviderRegistry: CourierProviderRegistry,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  /**
   * Rejects an unknown provider before it reaches a service. Nest's built-in
   * ParseEnumPipe would 400 with a message that leaks the enum shape, so the
   * check is done here with a merchant-readable error instead.
   */
  private parseProvider(value: string): CourierProviderEnum {
    const provider = value?.toUpperCase() as CourierProviderEnum;
    if (!Object.values(CourierProviderEnum).includes(provider)) {
      throw new BadRequestException(`Courier provider "${value}" is not supported.`);
    }
    return provider;
  }

  private async getMerchantStore(userId: string, storeId?: string): Promise<StoreEntity> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing shipments.');
    }
    return store;
  }

  @Get('shipments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List the merchant’s shipments with search, filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated shipments', type: ShipmentListResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 403, description: 'Caller lacks permission to read shipments' })
  async listShipments(
    @CurrentUser('sub') userId: string,
    @Query() query: ListShipmentsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShipmentListResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.listShipmentsService.execute(store.tenantId, query, store.currency);
  }

  @Get('shipments/summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'KPI cards, overview donut, courier performance and COD summary' })
  @ApiResponse({ status: 200, description: 'Shipment summary', type: ShipmentSummaryResponseDto })
  async getShipmentSummary(
    @CurrentUser('sub') userId: string,
    @Query() query: ListShipmentsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShipmentSummaryResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.getShipmentSummaryService.execute(store.tenantId, query, store.currency);
  }

  @Get('couriers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Supported courier providers (never returns credentials)' })
  @ApiResponse({ status: 200, description: 'Courier providers' })
  listCourierProviders() {
    return this.courierProviderRegistry.listProviders();
  }

  @Get('shipments/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Export the currently filtered shipments as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of the filtered shipments' })
  async exportShipments(
    @CurrentUser('sub') userId: string,
    @Query() query: ListShipmentsQueryDto,
    @Res() res: Response,
    @Headers('x-store-id') storeId?: string,
  ) {
    const store = await this.getMerchantStore(userId, storeId);
    const result = await this.exportShipmentsService.execute(
      store.tenantId,
      query,
      store.currency,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('X-Export-Row-Count', String(result.rowCount));
    res.setHeader('X-Export-Truncated', String(result.truncated));
    return res.send(result.content);
  }

  @Get('shipments/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Full shipment details including the real tracking timeline' })
  @ApiResponse({ status: 200, description: 'Shipment details', type: ShipmentDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Shipment not found for this merchant' })
  async getShipmentDetails(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShipmentDetailsResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.getShipmentDetailsService.execute(shipmentId, store.tenantId, store.currency);
  }

  @Post('shipments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Create a shipment and book it with the selected courier' })
  @ApiResponse({ status: 201, description: 'Shipment created', type: ShipmentDetailsResponseDto })
  @ApiResponse({ status: 409, description: 'A shipment already exists for this order' })
  async createShipment(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateShipmentDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShipmentDetailsResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.createShipmentService.execute(dto, store.tenantId, userId);
  }

  @Patch('shipments/:id/cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Cancel a shipment that a courier has not yet collected' })
  @ApiResponse({ status: 200, description: 'Shipment cancelled', type: ShipmentDetailsResponseDto })
  @ApiResponse({ status: 400, description: 'Shipment is not in a cancellable state' })
  async cancelShipment(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Body() dto: CancelShipmentDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShipmentDetailsResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.cancelShipmentService.execute(shipmentId, store.tenantId, userId, dto.reason);
  }

  @Post('shipments/:id/sync')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Pull the latest tracking state for a shipment from its courier' })
  @ApiResponse({ status: 201, description: 'Shipment synced', type: ShipmentDetailsResponseDto })
  async syncShipment(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) shipmentId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShipmentDetailsResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.syncConsignmentService.execute(shipmentId, store.tenantId, userId);
  }

  // ---------------------------------------------------------------------------
  // Courier integrations — the Couriers tab.
  //
  // Reads need only `orders:read` (the merchant's shipping team looks at courier
  // health), but anything that writes a credential requires `settings:write`,
  // because those keys can book and cancel parcels on the merchant's account.
  // No response on these routes ever contains an unmasked secret.
  // ---------------------------------------------------------------------------

  @Get('courier-integrations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Every courier provider with this merchant’s connection state and volume' })
  @ApiResponse({ status: 200, description: 'Couriers dashboard', type: CouriersDashboardResponseDto })
  async listCourierIntegrations(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CouriersDashboardResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.listCourierIntegrationsService.execute(store.tenantId);
  }

  @Get('courier-integrations/:provider')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'One courier’s integration detail (credentials masked)' })
  @ApiResponse({ status: 200, description: 'Courier integration', type: CourierIntegrationDto })
  @ApiResponse({ status: 400, description: 'Unsupported courier provider' })
  async getCourierIntegration(
    @CurrentUser('sub') userId: string,
    @Param('provider') provider: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CourierIntegrationDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.getCourierIntegrationService.execute(this.parseProvider(provider), store.tenantId);
  }

  @Patch('courier-integrations/:provider')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('settings:write')
  @ApiOperation({ summary: 'Connect a courier or update its credentials and automation settings' })
  @ApiResponse({ status: 200, description: 'Integration saved', type: CourierIntegrationDto })
  @ApiResponse({ status: 400, description: 'Required credentials are missing for this provider' })
  async upsertCourierIntegration(
    @CurrentUser('sub') userId: string,
    @Param('provider') provider: string,
    @Body() dto: UpsertCourierIntegrationDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CourierIntegrationDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.upsertCourierIntegrationService.execute(
      this.parseProvider(provider),
      store.tenantId,
      dto,
    );
  }

  @Patch('courier-integrations/:provider/toggle')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('settings:write')
  @ApiOperation({ summary: 'Enable or disable a connected courier (credentials are retained)' })
  @ApiResponse({ status: 200, description: 'Integration toggled', type: CourierIntegrationDto })
  @ApiResponse({ status: 404, description: 'Courier has not been connected yet' })
  async toggleCourierIntegration(
    @CurrentUser('sub') userId: string,
    @Param('provider') provider: string,
    @Body() dto: ToggleCourierIntegrationDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CourierIntegrationDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.toggleCourierIntegrationService.execute(
      this.parseProvider(provider),
      store.tenantId,
      dto.isEnabled,
    );
  }

  @Patch('courier-integrations/:provider/default')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('settings:write')
  @ApiOperation({ summary: 'Make this the courier pre-selected when booking a parcel' })
  @ApiResponse({ status: 200, description: 'Default courier set', type: CourierIntegrationDto })
  @ApiResponse({ status: 400, description: 'Courier must be connected before it can be the default' })
  async setDefaultCourier(
    @CurrentUser('sub') userId: string,
    @Param('provider') provider: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CourierIntegrationDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.setDefaultCourierService.execute(this.parseProvider(provider), store.tenantId);
  }

  @Post('courier-integrations/:provider/test')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('settings:write')
  @ApiOperation({ summary: 'Verify the stored credentials against the courier’s API' })
  @ApiResponse({ status: 201, description: 'Test result', type: CourierConnectionTestResponseDto })
  @ApiResponse({ status: 404, description: 'Courier has not been connected yet' })
  async testCourierConnection(
    @CurrentUser('sub') userId: string,
    @Param('provider') provider: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CourierConnectionTestResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.testCourierConnectionService.execute(this.parseProvider(provider), store.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Pathao store (pickup point) management — one-time setup, not part of the
  // per-order booking flow. Lets a merchant create/list Pathao stores from the
  // Couriers tab instead of copying a store_id in from Pathao's own panel.
  // ---------------------------------------------------------------------------

  @Post('pathao/stores')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('settings:write')
  @ApiOperation({ summary: 'Create a Pathao pickup store (Pathao approves it ~1h later)' })
  @ApiResponse({ status: 201, description: 'Store submitted', type: CreatePathaoStoreResponseDto })
  @ApiResponse({ status: 400, description: 'Pathao is not connected, or the request was rejected' })
  async createPathaoStore(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePathaoStoreDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CreatePathaoStoreResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.pathaoStoreService.createStore(store.tenantId, store, dto);
  }

  @Get('pathao/stores')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List this merchant’s Pathao pickup stores' })
  @ApiResponse({ status: 200, description: 'Pathao stores', type: [PathaoStoreDto] })
  @ApiResponse({ status: 400, description: 'Pathao is not connected' })
  async listPathaoStores(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PathaoStoreDto[]> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.pathaoStoreService.listStores(store.tenantId, store);
  }

  // ---------------------------------------------------------------------------
  // Pathao location lookups (city → zone → area) — cascading dropdowns for
  // pickup/recipient address selection. Results are cached process-wide (see
  // PathaoLocationService), so these are cheap to call from the checkout/admin
  // UI on each dropdown level rather than pre-fetching everything up front.
  // ---------------------------------------------------------------------------

  @Get('pathao/cities')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List Pathao delivery cities' })
  @ApiResponse({ status: 200, description: 'Cities', type: [PathaoCityDto] })
  @ApiResponse({ status: 400, description: 'Pathao is not connected' })
  async listPathaoCities(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PathaoCityDto[]> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.pathaoLocationService.listCities(store.tenantId, store);
  }

  @Get('pathao/cities/:cityId/zones')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List Pathao delivery zones within a city' })
  @ApiResponse({ status: 200, description: 'Zones', type: [PathaoZoneDto] })
  @ApiResponse({ status: 400, description: 'Pathao is not connected' })
  async listPathaoZones(
    @CurrentUser('sub') userId: string,
    @Param('cityId') cityId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PathaoZoneDto[]> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.pathaoLocationService.listZones(store.tenantId, store, Number(cityId));
  }

  @Get('pathao/zones/:zoneId/areas')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List Pathao delivery areas within a zone' })
  @ApiResponse({ status: 200, description: 'Areas', type: [PathaoAreaDto] })
  @ApiResponse({ status: 400, description: 'Pathao is not connected' })
  async listPathaoAreas(
    @CurrentUser('sub') userId: string,
    @Param('zoneId') zoneId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PathaoAreaDto[]> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.pathaoLocationService.listAreas(store.tenantId, store, Number(zoneId));
  }

  @Post('pathao/price-plan')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Calculate the Pathao delivery fee for a route before booking' })
  @ApiResponse({ status: 201, description: 'Price', type: PathaoPriceDto })
  @ApiResponse({ status: 400, description: 'Pathao is not connected, or the route is invalid' })
  async calculatePathaoPrice(
    @CurrentUser('sub') userId: string,
    @Body() dto: CalculatePathaoPriceDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PathaoPriceDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.pathaoPriceService.calculatePrice(store.tenantId, store, dto);
  }

  // ---------------------------------------------------------------------------
  // RedX delivery-area lookups. Results are cached process-wide (see
  // RedxAreaService), so these are cheap to call from the admin UI.
  // ---------------------------------------------------------------------------

  @Get('redx/areas')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List RedX delivery areas, optionally filtered by post code or district' })
  @ApiResponse({ status: 200, description: 'Areas', type: [RedxAreaDto] })
  @ApiResponse({ status: 400, description: 'RedX is not connected' })
  async listRedxAreas(
    @CurrentUser('sub') userId: string,
    @Query('postCode') postCode?: string,
    @Query('district') district?: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<RedxAreaDto[]> {
    const store = await this.getMerchantStore(userId, storeId);
    if (postCode) {
      return this.redxAreaService.listAreasByPostCode(store.tenantId, store, Number(postCode));
    }
    if (district) {
      return this.redxAreaService.listAreasByDistrict(store.tenantId, store, district);
    }
    return this.redxAreaService.listAllAreas(store.tenantId, store);
  }

  @Get('redx/charge')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Calculate the RedX delivery + COD charge for a route before booking' })
  @ApiResponse({ status: 200, description: 'Charge', type: RedxChargeDto })
  @ApiResponse({ status: 400, description: 'RedX is not connected, or the route is invalid' })
  async calculateRedxCharge(
    @CurrentUser('sub') userId: string,
    @Query() dto: CalculateRedxChargeDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<RedxChargeDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.redxChargeService.calculateCharge(store.tenantId, store, dto);
  }

  // ---------------------------------------------------------------------------
  // RedX pickup store (pickup point) management — one-time setup, not part of
  // the per-order booking flow. A store's id becomes `pickup_store_id` on a
  // Create Parcel call.
  // ---------------------------------------------------------------------------

  @Post('redx/stores')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('settings:write')
  @ApiOperation({ summary: 'Create a RedX pickup store' })
  @ApiResponse({ status: 201, description: 'Store created', type: RedxStoreDto })
  @ApiResponse({ status: 400, description: 'RedX is not connected, or the request was rejected' })
  async createRedxStore(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateRedxStoreDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<RedxStoreDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.redxStoreService.createStore(store.tenantId, store, dto);
  }

  @Get('redx/stores')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'List this merchant’s RedX pickup stores' })
  @ApiResponse({ status: 200, description: 'RedX pickup stores', type: [RedxStoreDto] })
  @ApiResponse({ status: 400, description: 'RedX is not connected' })
  async listRedxStores(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<RedxStoreDto[]> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.redxStoreService.listStores(store.tenantId, store);
  }

  @Get('redx/stores/:pickupStoreId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Get one RedX pickup store’s details' })
  @ApiResponse({ status: 200, description: 'RedX pickup store', type: RedxStoreDto })
  @ApiResponse({ status: 400, description: 'RedX is not connected, or the store was not found' })
  async getRedxStore(
    @CurrentUser('sub') userId: string,
    @Param('pickupStoreId') pickupStoreId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<RedxStoreDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.redxStoreService.getStore(store.tenantId, store, Number(pickupStoreId));
  }

  // ---------------------------------------------------------------------------
  // Paperfly exchange orders — a merchant-initiated action against an
  // already-delivered order, not part of the standard shipment booking flow.
  // ---------------------------------------------------------------------------

  @Post('paperfly/exchange-orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Create a Paperfly exchange order for an already-delivered order' })
  @ApiResponse({ status: 201, description: 'Exchange order created', type: PaperflyExchangeOrderResultDto })
  @ApiResponse({ status: 400, description: 'Paperfly is not connected, or the request was rejected' })
  async createPaperflyExchangeOrder(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePaperflyExchangeOrderDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<PaperflyExchangeOrderResultDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.paperflyExchangeService.createExchangeOrder(store.tenantId, store, dto);
  }

  // ---------------------------------------------------------------------------
  // Order-module integration points. The Orders UI books and syncs a parcel from
  // the order screen, so these routes stay stable and delegate to the same
  // shipment services rather than duplicating the flow.
  // ---------------------------------------------------------------------------

  @Post('book')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Book a courier parcel for an order (Orders screen entry point)' })
  @ApiResponse({ status: 201, description: 'Shipment created', type: ShipmentDetailsResponseDto })
  async bookCourier(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateShipmentDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShipmentDetailsResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.createShipmentService.execute(dto, store.tenantId, userId);
  }

  @Post('consignments/order/:orderId/sync')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Sync the shipment attached to an order (Orders screen entry point)' })
  @ApiResponse({ status: 201, description: 'Shipment synced', type: ShipmentDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'No shipment exists for this order' })
  async syncConsignmentByOrder(
    @CurrentUser('sub') userId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShipmentDetailsResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    const shipmentId = await this.syncConsignmentService.resolveShipmentIdByOrder(
      orderId,
      store.tenantId,
    );
    return this.syncConsignmentService.execute(shipmentId, store.tenantId, userId);
  }
}
