import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateWarehouseService } from './services/create-warehouse.service';
import { ListWarehousesService } from './services/list-warehouses.service';
import { AdjustStockService } from './services/adjust-stock.service';
import { GetInventoryStockService } from './services/get-inventory-stock.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@ApiTags('Inventory Control')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly createWarehouseService: CreateWarehouseService,
    private readonly listWarehousesService: ListWarehousesService,
    private readonly adjustStockService: AdjustStockService,
    private readonly getInventoryStockService: GetInventoryStockService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing inventory stock.');
    }
    return store.tenantId;
  }

  @Post('warehouses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new fulfillment warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created successfully' })
  async createWarehouse(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateWarehouseDto,
  ) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.createWarehouseService.execute(tenantId, dto);
  }

  @Get('warehouses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all warehouses for merchant store' })
  @ApiResponse({ status: 200, description: 'List of store warehouses' })
  async listWarehouses(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.listWarehousesService.execute(tenantId);
  }

  @Post('adjust')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust physical stock counts for a product' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  async adjustStock(
    @CurrentUser('sub') userId: string,
    @Body() dto: AdjustStockDto,
  ) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.adjustStockService.execute(tenantId, dto);
  }

  @Get('stocks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stock inventory levels across products for merchant' })
  @ApiResponse({ status: 200, description: 'Inventory stock list' })
  async getInventoryStocks(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.getInventoryStockService.execute(tenantId);
  }
}
