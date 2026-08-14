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
import { SeedShipmentDemoDataService } from './services/seed-shipment-demo-data.service';
import { CourierProviderRegistry } from './adapters/courier-provider.registry';

import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CancelShipmentDto } from './dto/cancel-shipment.dto';
import { ListShipmentsQueryDto } from './dto/list-shipments-query.dto';
import { ShipmentListResponseDto } from './dto/shipment-list-response.dto';
import { ShipmentSummaryResponseDto } from './dto/shipment-summary-response.dto';
import { ShipmentDetailsResponseDto } from './dto/shipment-details-response.dto';
import { SeedShipmentDemoDataResponseDto } from './dto/seed-shipment-demo-data-response.dto';

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
    private readonly seedShipmentDemoDataService: SeedShipmentDemoDataService,
    private readonly courierProviderRegistry: CourierProviderRegistry,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

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

  @Post('shipments/seed-demo-data')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('orders:manage')
  @ApiOperation({ summary: 'Seed realistic shipment demo data for this merchant' })
  @ApiResponse({ status: 201, description: 'Demo data seeded', type: SeedShipmentDemoDataResponseDto })
  @ApiResponse({ status: 403, description: 'Demo seeder disabled in production environment' })
  async seedShipmentDemoData(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<SeedShipmentDemoDataResponseDto> {
    const store = await this.getMerchantStore(userId, storeId);
    return this.seedShipmentDemoDataService.execute(
      store.tenantId,
      store.slug,
      store.address,
    );
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
