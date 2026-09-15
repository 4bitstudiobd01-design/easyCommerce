import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateWarehouseService } from './services/create-warehouse.service';
import { ListWarehousesService } from './services/list-warehouses.service';
import { UpdateWarehouseService } from './services/update-warehouse.service';
import { DeleteWarehouseService } from './services/delete-warehouse.service';
import { AdjustStockService } from './services/adjust-stock.service';
import { GetInventoryStockService } from './services/get-inventory-stock.service';
import { ListStockMovementsService } from './services/list-stock-movements.service';
import { ListInventoryService } from './services/list-inventory.service';
import { GetInventoryKpisService } from './services/get-inventory-kpis.service';
import { GetInventoryDetailsService } from './services/get-inventory-details.service';
import { ListInventoryHistoryService } from './services/list-inventory-history.service';
import { GetProductVariantInventoryService } from './services/get-product-variant-inventory.service';
import { BulkAdjustStockService } from './services/bulk-adjust-stock.service';
import { GetInventorySettingsOverviewService } from './services/get-inventory-settings-overview.service';
import { SeedInventoryDemoDataService } from './services/seed-inventory-demo-data.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { BulkAdjustStockDto } from './dto/bulk-adjust-stock.dto';
import { BulkAdjustStockResponseDto } from './dto/bulk-adjust-stock-response.dto';
import { ListInventoryQueryDto } from './dto/list-inventory-query.dto';
import { InventoryListResponseDto } from './dto/inventory-list-response.dto';
import { InventoryKpiResponseDto } from './dto/inventory-kpi-response.dto';
import { InventoryDetailsResponseDto } from './dto/inventory-details-response.dto';
import { StockAdjustmentResponseDto } from './dto/stock-adjustment-response.dto';
import { ListInventoryHistoryQueryDto } from './dto/list-inventory-history-query.dto';
import { InventoryHistoryResponseDto } from './dto/inventory-history-response.dto';
import { ListProductVariantInventoryQueryDto } from './dto/list-product-variant-inventory-query.dto';
import { ProductVariantInventoryResponseDto } from './dto/product-variant-inventory-response.dto';
import { InventorySettingsOverviewResponseDto } from './dto/inventory-settings-overview-response.dto';
import { SeedInventoryDemoDataResponseDto } from './dto/seed-inventory-demo-data-response.dto';

@ApiTags('Inventory Control')
@Controller('inventory')
export class InventoryController {

  constructor(
    private readonly createWarehouseService: CreateWarehouseService,
    private readonly listWarehousesService: ListWarehousesService,
    private readonly updateWarehouseService: UpdateWarehouseService,
    private readonly deleteWarehouseService: DeleteWarehouseService,
    private readonly adjustStockService: AdjustStockService,
    private readonly bulkAdjustStockService: BulkAdjustStockService,
    private readonly getInventoryStockService: GetInventoryStockService,
    private readonly listStockMovementsService: ListStockMovementsService,
    private readonly listInventoryService: ListInventoryService,
    private readonly getInventoryKpisService: GetInventoryKpisService,
    private readonly getInventoryDetailsService: GetInventoryDetailsService,
    private readonly listInventoryHistoryService: ListInventoryHistoryService,
    private readonly getProductVariantInventoryService: GetProductVariantInventoryService,
    private readonly getInventorySettingsOverviewService: GetInventorySettingsOverviewService,
    private readonly seedInventoryDemoDataService: SeedInventoryDemoDataService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}





  private async getMerchantTenantId(userId: string, storeId?: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing inventory stock.');
    }
    return store.tenantId;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paginated, filterable, and searchable inventory list for merchant' })
  @ApiResponse({ status: 200, description: 'Paginated inventory items', type: InventoryListResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async listInventory(
    @CurrentUser('sub') userId: string,
    @Query() query: ListInventoryQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<InventoryListResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listInventoryService.execute(tenantId, query);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias route for paginated inventory list' })
  @ApiResponse({ status: 200, description: 'Paginated inventory items', type: InventoryListResponseDto })
  async listInventoryAlias(
    @CurrentUser('sub') userId: string,
    @Query() query: ListInventoryQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<InventoryListResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listInventoryService.execute(tenantId, query);
  }

  @Get('kpis')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Real-time aggregated inventory KPIs and stock health metrics' })
  @ApiResponse({ status: 200, description: 'Inventory KPIs', type: InventoryKpiResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async getInventoryKpis(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<InventoryKpiResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getInventoryKpisService.execute(tenantId);
  }

  @Post('warehouses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new fulfillment warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async createWarehouse(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateWarehouseDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.createWarehouseService.execute(tenantId, dto);
  }

  @Get('warehouses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all warehouses for merchant store' })
  @ApiResponse({ status: 200, description: 'List of store warehouses' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async listWarehouses(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listWarehousesService.execute(tenantId);
  }

  @Patch('warehouses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a fulfillment warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse updated successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 404, description: 'Warehouse not found or access denied' })
  @ApiResponse({ status: 409, description: 'Warehouse code already in use' })
  async updateWarehouse(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.updateWarehouseService.execute(tenantId, id, dto);
  }

  @Delete('warehouses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a fulfillment warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse deleted successfully' })
  @ApiResponse({ status: 400, description: 'Warehouse still has stock or is the sole default warehouse' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 404, description: 'Warehouse not found or access denied' })
  async deleteWarehouse(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteWarehouseService.execute(tenantId, id);
  }

  @Post('adjust')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust physical stock counts for a product or inventory record' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully', type: StockAdjustmentResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment parameters or insufficient stock' })
  async adjustStock(
    @CurrentUser('sub') userId: string,
    @Body() dto: AdjustStockDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<StockAdjustmentResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.adjustStockService.execute(tenantId, dto, userId);
  }

  @Post(':id/adjust')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust physical stock counts for a specific inventory stock item' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully', type: StockAdjustmentResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment parameters or insufficient stock' })
  async adjustStockById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<StockAdjustmentResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    dto.inventoryId = id;
    return this.adjustStockService.execute(tenantId, dto, userId);
  }

  @Post('bulk-adjust')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atomically perform bulk stock adjustments across multiple inventory records' })
  @ApiResponse({ status: 200, description: 'Bulk stock adjustment success response', type: BulkAdjustStockResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid bulk adjustment request or boundary violation' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 404, description: 'One or more inventory records not found or access denied' })
  async bulkAdjustStock(
    @CurrentUser('sub') userId: string,
    @Body() dto: BulkAdjustStockDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<BulkAdjustStockResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.bulkAdjustStockService.execute(tenantId, dto, userId);
  }

  @Get('movements/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stock movement logs for a product' })
  @ApiResponse({ status: 200, description: 'Stock movement history' })
  async getStockMovements(
    @CurrentUser('sub') userId: string,
    @Param('productId') productId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listStockMovementsService.execute(productId, tenantId);
  }

  @Get('stocks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stock inventory levels across products for merchant' })
  @ApiResponse({ status: 200, description: 'Inventory stock list' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async getInventoryStocks(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getInventoryStockService.execute(tenantId);
  }

  @Get('stock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stock inventory alias route for frontend' })
  @ApiResponse({ status: 200, description: 'Inventory stock list' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async getInventoryStockAlias(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getInventoryStockService.execute(tenantId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated and filterable store-wide inventory movement history' })
  @ApiResponse({ status: 200, description: 'Paginated movement history', type: InventoryHistoryResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async listAllInventoryHistory(
    @CurrentUser('sub') userId: string,
    @Query() query: ListInventoryHistoryQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<InventoryHistoryResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listInventoryHistoryService.execute(tenantId, query);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated movement history for a specific inventory stock item' })
  @ApiResponse({ status: 200, description: 'Paginated movement history for item', type: InventoryHistoryResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 404, description: 'Inventory stock record not found or access denied' })
  async listInventoryStockHistory(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Query() query: ListInventoryHistoryQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<InventoryHistoryResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listInventoryHistoryService.execute(tenantId, query, id);
  }

  @Get('product/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete variant-level inventory stock and aggregated summary for a product' })
  @ApiResponse({ status: 200, description: 'Product variant inventory response', type: ProductVariantInventoryResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 404, description: 'Product not found or access denied' })
  async getProductVariantInventory(
    @CurrentUser('sub') userId: string,
    @Param('productId') productId: string,
    @Query() query: ListProductVariantInventoryQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductVariantInventoryResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getProductVariantInventoryService.execute(tenantId, productId, query);
  }

  @Get('products/:productId/variants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete variant-level inventory stock alias endpoint' })
  @ApiResponse({ status: 200, description: 'Product variant inventory response', type: ProductVariantInventoryResponseDto })
  async getProductVariantInventoryAlias(
    @CurrentUser('sub') userId: string,
    @Param('productId') productId: string,
    @Query() query: ListProductVariantInventoryQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductVariantInventoryResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getProductVariantInventoryService.execute(tenantId, productId, query);
  }

  @Get('settings/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get live inventory settings overview, data statistics, and integrity status' })
  @ApiResponse({ status: 200, description: 'Inventory settings overview', type: InventorySettingsOverviewResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  async getInventorySettingsOverview(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<InventorySettingsOverviewResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getInventorySettingsOverviewService.execute(tenantId);
  }

  @Post('settings/seed-demo-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed realistic demo products, variants, stocks, and movement history' })
  @ApiResponse({ status: 200, description: 'Demo data seeded successfully', type: SeedInventoryDemoDataResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 403, description: 'Demo seeder disabled in production environment' })
  async seedInventoryDemoData(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<SeedInventoryDemoDataResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.seedInventoryDemoDataService.execute(tenantId, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete inventory details by stock ID for merchant' })
  @ApiResponse({ status: 200, description: 'Inventory details response', type: InventoryDetailsResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 404, description: 'Inventory stock record not found or access denied' })

  async getInventoryDetails(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<InventoryDetailsResponseDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getInventoryDetailsService.execute(tenantId, id);
  }

}


