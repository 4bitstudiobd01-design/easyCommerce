import { Controller, Post, Get, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StockTransferService } from '../services/stock-transfer.service';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TransferStockDto } from '../dto/transfer-stock.dto';

@ApiTags('Multi-Warehouse Stock Transfers')
@Controller('inventory/transfers')
export class StockTransferController {
  constructor(
    private readonly stockTransferService: StockTransferService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store first.');
    }
    return store.tenantId;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  @ApiResponse({ status: 201, description: 'Stock transferred successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Invalid transfer request or insufficient stock' })
  async transferStock(
    @CurrentUser('sub') userId: string,
    @Body() dto: TransferStockDto,
  ) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.stockTransferService.transferStock(tenantId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List stock transfers for merchant store' })
  @ApiResponse({ status: 200, description: 'List of stock transfers for the merchant store' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  @ApiResponse({ status: 400, description: 'Merchant has not created a store yet' })
  async listTransfers(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.stockTransferService.listStockTransfers(tenantId);
  }
}
